import type { ApparelPlacement, DesignSide } from '@/api/builderModels';
import i18n from '@/i18n';
import type { TFunction } from 'i18next';
import { DESIGN_SIDES, parseApparelTexts } from '@/api/builderModels';
import type { BaseProduct, ProductInput, SavedProduct } from '@/api/commerceModels';
import { productFormData } from '@/api/endpoints/productSlice';
import { uniqueId } from '@/helper/design';
import { useApparelStore } from '@/store/apparelStore';

const NEUTRAL_GARMENT = '#EFEBE4';

/** Colour of the base product, used to tint drawn garments. */
export function pieceColor(base?: Pick<BaseProduct, 'colorHex'> | null) {
  return base?.colorHex || NEUTRAL_GARMENT;
}

/** The draft as a CUSTOMER product made on its base product, in the chosen size. */
export function apparelInput(categoryId: string): ProductInput {
  const draft = useApparelStore.getState();
  if (!draft.baseProductId) throw new Error(i18n.t('apparel.choosePieceError'));
  // Customer artwork is uploaded alongside; each own design points at its file.
  let uploads = 0;
  // Printed text keeps its side; it is never priced.
  const texts = draft.texts.filter((layer) => layer.text.trim()).map((layer) => ({
    ...layer,
    text: layer.text.trim(),
    x: round(layer.x),
    y: round(layer.y),
    scale: round(layer.scale),
    rotation: Math.round(layer.rotation),
  }));
  return {
    categoryId,
    baseProductId: draft.baseProductId,
    ...(draft.size ? { selectedSizeId: draft.size } : {}),
    name: draft.name.trim() || i18n.t('drafts.myDesign'),
    // One ProductItem per placed design keeps pricing (quantity × unitPrice) unchanged.
    items: draft.placements.map((placement, position) => ({
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
    ...(texts.length ? { textLayers: texts } : {}),
  };
}

/** Uploaded artwork of the draft, in customDesignIndex order. */
export function customDesignUris() {
  return useApparelStore.getState().placements
    .flatMap((placement) => (placement.imageUri ? [placement.imageUri] : []));
}
const round = (value: number) => Math.round(value * 10000) / 10000;

export function apparelSignature(categoryId: string) {
  return JSON.stringify({
    previewVersion: 'apparel-v3', product: apparelInput(categoryId), uploads: customDesignUris(),
  });
}

/**
 * Saves the current apparel design as a new CUSTOMER Product: structured placements on
 * its base product and size, and a clean preview of each side. Unchanged designs reuse
 * the last saved Product instead of uploading again. Saving never touches stock.
 */
export async function saveApparelDesign(
  userId: string,
  categoryId: string,
  captureSide: (side: DesignSide) => Promise<string>,
  createProduct: (formData: FormData) => Promise<SavedProduct>,
): Promise<SavedProduct> {
  const input = apparelInput(categoryId);
  const signature = apparelSignature(categoryId);
  const saved = useApparelStore.getState().saved;
  if (saved?.userId === userId && saved.signature === signature)
    return saved.product;
  const front = await captureSide('FRONT');
  const back = await captureSide('BACK');
  const product = await createProduct(await productFormData(input, front, back, customDesignUris()));
  useApparelStore.getState().markSaved({ userId, signature, product });
  return product;
}

/**
 * Opens a saved apparel Product in the studio. Customers can only order their own
 * products, so edits and copies are always saved as a new Product.
 */
export function loadApparelDesign(product: Pick<SavedProduct,
  'categoryId' | 'name' | 'items' | 'baseProductId' | 'baseProduct' | 'selectedSize' | 'textLayers'>,
  name = product.name) {
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
    baseProductId: product.baseProductId ?? product.baseProduct?.id ?? null,
    size: product.selectedSize?.id ?? null,
    name,
    placements,
    texts: parseApparelTexts(product.textLayers),
  });
  useApparelStore.getState().markSaved(null);
}

export function isApparelProduct(product: { category?: { builderType?: string | null } | null }) {
  return product.category?.builderType === 'APPAREL';
}

/** Summary line parts for an apparel design, e.g. ['2 designs', 'Black', 'L']. */
export function apparelMeta(t: TFunction, product: Pick<SavedProduct, 'itemCount' | 'baseProduct' | 'selectedSize'>) {
  return [
    t('counts.design', { count: product.itemCount }),
    ...(product.baseProduct?.color ? [product.baseProduct.color] : []),
    ...(product.selectedSize?.name ? [product.selectedSize.name] : []),
  ];
}

/** Image of an apparel design: its captured preview, else its base product's photo. */
export function apparelImage(product: Pick<SavedProduct, 'designPreviewUrl' | 'imageUrl' | 'baseProduct'>) {
  return product.designPreviewUrl ?? product.imageUrl ?? product.baseProduct?.imageUrl ?? null;
}
