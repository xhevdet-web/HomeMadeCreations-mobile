import type { ApparelPlacement, DesignSide, SelectedOptions } from '@/api/builderModels';
import type { GarmentVariant } from '@/api/garmentModels';
import { DESIGN_SIDES, parseCategoryOptions } from '@/api/builderModels';
import type { ProductInput, SavedProduct } from '@/api/commerceModels';
import { productFormData } from '@/api/endpoints/productSlice';
import { uniqueId } from '@/helper/design';
import { useApparelStore } from '@/store/apparelStore';

const NEUTRAL_GARMENT = '#EFEBE4';

/** Garment colour of the chosen variant, used to tint drawn garments. */
export function garmentColor(variant?: Pick<GarmentVariant, 'colorValue'> | null) {
  return variant?.colorValue || NEUTRAL_GARMENT;
}

/** `plain` orders the garment as it is, without the draft's designs. */
export function apparelInput(categoryId: string, plain = false): ProductInput {
  const draft = useApparelStore.getState();
  if (!draft.variantId) throw new Error('Choose a size and colour for your piece.');
  const placements = plain ? [] : draft.placements;
  // Customer artwork is uploaded alongside; each own design points at its file.
  let uploads = 0;
  return {
    categoryId,
    garmentVariantId: draft.variantId,
    name: draft.name.trim() || 'My design',
    selectedOptions: draft.selectedOptions,
    // One ProductItem per placed design keeps pricing (quantity × unitPrice) unchanged.
    items: placements.map((placement, position) => ({
      subCategoryId: placement.subCategoryId,
      quantity: 1,
      position,
      side: placement.side,
      x: round(placement.x),
      y: round(placement.y),
      scale: round(placement.scale),
      rotation: Math.round(placement.rotation),
      ...(placement.imageUri ? { customDesignIndex: uploads++ } : {}),
    })),
  };
}

/** Uploaded artwork of the draft, in customDesignIndex order. */
export function customDesignUris(plain = false) {
  return plain ? [] : useApparelStore.getState().placements
    .flatMap((placement) => (placement.imageUri ? [placement.imageUri] : []));
}
const round = (value: number) => Math.round(value * 10000) / 10000;

export function apparelSignature(categoryId: string, plain = false) {
  return JSON.stringify({
    previewVersion: 'apparel-v1', product: apparelInput(categoryId, plain), uploads: customDesignUris(plain),
  });
}

/**
 * Saves the current apparel design as a new Product: structured placements, the
 * selected options and a clean preview of each side. Unchanged designs reuse the last
 * saved Product instead of uploading again.
 */
export async function saveApparelDesign(
  userId: string,
  categoryId: string,
  captureSide: (side: DesignSide) => Promise<string>,
  createProduct: (formData: FormData) => Promise<SavedProduct>,
  plain = false,
): Promise<SavedProduct> {
  const input = apparelInput(categoryId, plain);
  const signature = apparelSignature(categoryId, plain);
  const saved = useApparelStore.getState().saved;
  if (saved?.userId === userId && saved.signature === signature)
    return saved.product;
  // A plain garment needs no generated preview: its own photo represents it.
  const front = plain ? undefined : await captureSide('FRONT');
  const back = plain ? undefined : await captureSide('BACK');
  const product = await createProduct(await productFormData(input, front, back, customDesignUris(plain)));
  useApparelStore.getState().markSaved({ userId, signature, product });
  return product;
}

/** Selected options as the app stores them (colours as their configured value). */
export function selectedOptionValues(stored: Record<string, unknown> | null | undefined): SelectedOptions {
  const values: SelectedOptions = {};
  for (const [key, value] of Object.entries(stored ?? {})) {
    if (typeof value === 'string' || typeof value === 'number') values[key] = value;
    else if (value && typeof value === 'object' && 'value' in value &&
      typeof (value as { value: unknown }).value === 'string')
      values[key] = (value as { value: string }).value;
  }
  return values;
}

/**
 * Opens a saved apparel Product in the studio. Customers can only order their own
 * products, so edits and copies are always saved as a new Product.
 */
export function loadApparelDesign(product: Pick<SavedProduct,
  'categoryId' | 'name' | 'items' | 'selectedOptions' | 'garmentVariant'>, name = product.name) {
  const placements: ApparelPlacement[] = [];
  for (const item of product.items ?? []) {
    for (let copy = 0; copy < Math.max(item.quantity, 1); copy++) {
      placements.push({
        id: uniqueId(),
        subCategoryId: item.subCategoryId,
        side: DESIGN_SIDES.includes(item.side as DesignSide) ? (item.side as DesignSide) : 'FRONT',
        x: item.x ?? 0.5,
        y: item.y ?? 0.5,
        scale: item.scale ?? 1,
        rotation: item.rotation ?? 0,
        ...(item.customImageUrl ? { imageUri: item.customImageUrl } : {}),
      });
    }
  }
  useApparelStore.getState().load({
    categoryId: product.categoryId,
    garmentId: product.garmentVariant?.garment.id ?? null,
    variantId: product.garmentVariant?.id ?? null,
    name,
    selectedOptions: selectedOptionValues(product.selectedOptions),
    placements,
  });
  useApparelStore.getState().markSaved(null);
}

export function isApparelProduct(product: { category?: { builderType?: string | null } | null }) {
  return product.category?.builderType === 'APPAREL';
}

/** Option rows for summaries, e.g. [{ name: 'Size', value: 'L' }, { name: 'Color', value: 'Black' }]. */
export function optionSummary(options: unknown, stored: Record<string, unknown> | null | undefined) {
  const parsed = parseCategoryOptions(options);
  return Object.entries(stored ?? {}).map(([key, value]) => {
    const option = parsed.find((entry) => entry.key === key);
    const label = value && typeof value === 'object' && 'name' in value
      ? String((value as { name: unknown }).name)
      : option?.type === 'color'
        ? option.values.find((color) => color.value === value)?.name ?? String(value)
        : String(value);
    return { key, name: option?.name ?? key, value: label,
      swatch: option?.type === 'color' ? selectedOptionValues({ [key]: value })[key] : undefined };
  });
}

/** Summary line parts for an apparel design, e.g. ['2 designs', 'Red', 'S', 'For Ana']. */
export function apparelMeta(product: Pick<SavedProduct, 'itemCount' | 'garmentVariant' | 'selectedOptions'>
  & { category?: { options?: unknown } | null }) {
  const variant = product.garmentVariant;
  return [
    `${product.itemCount} ${product.itemCount === 1 ? 'design' : 'designs'}`,
    ...(variant ? [variant.colorName, variant.size] : []),
    ...optionSummary(product.category?.options, product.selectedOptions).map((option) => option.value),
  ];
}

/** Image of an apparel design: its captured preview, else the garment's own photo. */
export function apparelImage(product: Pick<SavedProduct, 'designPreviewUrl' | 'imageUrl' | 'garmentVariant'>) {
  const garment = product.garmentVariant?.garment;
  return product.designPreviewUrl ?? product.imageUrl ?? garment?.imageUrl ?? garment?.frontImageUrl ?? null;
}
