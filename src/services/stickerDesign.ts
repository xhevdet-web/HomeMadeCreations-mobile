import i18n from '@/i18n';
import type { TFunction } from 'i18next';
import type { ProductInput, SavedProduct } from '@/api/commerceModels';
import { productFormData } from '@/api/endpoints/productSlice';
import { DEFAULT_TRANSFORM } from '@/helper/caseStudio';
import { artworkOf, clampQuantity, parseStickerSize, stickerCount, stickerSizeLine } from '@/helper/stickers';
import { useStickerStore, type StickerDesign } from '@/store/stickerStore';

export const STICKER_BUILDER = 'STICKER';

export function isStickerProduct(product: { category?: { builderType?: string | null } | null }) {
  return product.category?.builderType === STICKER_BUILDER;
}

/** The first design that still needs an image, if any. */
export const designWithoutImage = (designs: StickerDesign[]) =>
  designs.find((design) => !artworkOf(design) || !design.subCategoryId);

/**
 * The set as a CUSTOMER product: its size, and one ProductItem per design holding the
 * artwork (an upload, or one of the category's designs), its placement and how many
 * stickers to print. The backend prices it from the size's price per sticker; nothing
 * here decides the price.
 */
export function stickerInput(categoryId: string): ProductInput {
  const draft = useStickerStore.getState();
  if (!draft.size) throw new Error(i18n.t('stickers.errors.chooseSize'));
  const missing = designWithoutImage(draft.designs);
  if (!draft.designs.length || missing) throw new Error(i18n.t('stickers.errors.addImage', {
    number: draft.designs.indexOf(missing!) + 1,
  }));
  // Uploads are numbered among uploads only, in design order (see artworkUris).
  let upload = 0;
  return {
    categoryId,
    selectedSizeId: draft.size.id,
    name: draft.name.trim() || i18n.t('stickers.defaultName'),
    items: draft.designs.map((design, index) => ({
      subCategoryId: design.subCategoryId!,
      quantity: design.quantity,
      position: index,
      x: design.x,
      y: design.y,
      scale: design.scale,
      rotation: design.rotation,
      ...(design.imageUri ? { customDesignIndex: upload++ } : {}),
    })),
  };
}

/** The uploaded artwork, in design order (referenced by customDesignIndex). */
const artworkUris = () => useStickerStore.getState().designs.flatMap((design) => design.imageUri ?? []);

function stickerSignature(categoryId: string) {
  return JSON.stringify({ previewVersion: 'sticker-v1', product: stickerInput(categoryId), uploads: artworkUris() });
}

/**
 * Saves the set as a new CUSTOMER Product with a preview of all its designs. An unchanged
 * set reuses the last saved Product. A set reopened from My Designs sends its stored
 * artwork again from there: the customer never uploads twice.
 */
export async function saveStickerDesign(
  userId: string,
  categoryId: string,
  capture: () => Promise<string>,
  createProduct: (formData: FormData) => Promise<SavedProduct>,
): Promise<SavedProduct> {
  const input = stickerInput(categoryId);
  const signature = stickerSignature(categoryId);
  const saved = useStickerStore.getState().saved;
  if (saved?.userId === userId && saved.signature === signature) return saved.product;
  const product = await createProduct(await productFormData(input, await capture(), undefined, artworkUris()));
  useStickerStore.getState().markSaved({ userId, signature, product });
  return product;
}

/**
 * Opens a saved set in the Sticker Studio with its size, artwork, placements and
 * quantities restored. Customers only order their own products, so an edit is saved as a
 * new Product.
 */
export function loadStickerDesign(product: Pick<SavedProduct, 'categoryId' | 'name' | 'items' | 'selectedSize'>,
  name = product.name) {
  const designs: StickerDesign[] = [...(product.items ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((item, index) => ({
      id: `${item.id ?? index}`,
      subCategoryId: item.subCategoryId,
      imageUri: item.customImageUrl ?? undefined,
      designImageUrl: item.customImageUrl ? undefined : item.subCategory?.imageUrl ?? undefined,
      imageSize: null,
      quantity: clampQuantity(item.quantity),
      x: item.x ?? DEFAULT_TRANSFORM.x,
      y: item.y ?? DEFAULT_TRANSFORM.y,
      scale: item.scale ?? DEFAULT_TRANSFORM.scale,
      rotation: item.rotation ?? DEFAULT_TRANSFORM.rotation,
    }));
  useStickerStore.getState().load({
    categoryId: product.categoryId,
    size: parseStickerSize(product.selectedSize),
    name,
    designs,
    activeId: designs[0]?.id ?? null,
  });
  useStickerStore.getState().markSaved(null);
}

/** Summary line parts, e.g. ['Square • 5 × 5 cm', '3 designs', '35 stickers']. */
export function stickerMeta(t: TFunction, product: Pick<SavedProduct, 'selectedSize' | 'items'>) {
  const size = parseStickerSize(product.selectedSize);
  const items = product.items ?? [];
  return [
    size ? stickerSizeLine(t, size) : null,
    t('stickers.designCount', { count: items.length }),
    t('stickers.stickerCount', { count: stickerCount(items) }),
  ].filter((part): part is string => !!part);
}
