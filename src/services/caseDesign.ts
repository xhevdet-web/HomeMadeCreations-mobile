import i18n from '@/i18n';
import type { TFunction } from 'i18next';
import { CUSTOM_UPLOAD } from '@/api/builderModels';
import type { ProductInput, SavedProduct } from '@/api/commerceModels';
import { productFormData } from '@/api/endpoints/productSlice';
import { useCaseStore } from '@/store/caseStore';

export const CASE_BUILDER = 'CASE';

export function isCaseProduct(product: { category?: { builderType?: string | null } | null }) {
  return product.category?.builderType === CASE_BUILDER;
}

/**
 * The draft as a CUSTOMER product made on its phone model: one ProductItem holding the
 * design (or own photo) and its transform. The backend prices it from the model and the
 * design; nothing here decides the price.
 */
export function caseInput(categoryId: string): ProductInput {
  const draft = useCaseStore.getState();
  if (!draft.modelId) throw new Error(i18n.t('cases.errors.chooseModel'));
  const artwork = draft.artwork;
  if (!artwork) throw new Error(i18n.t('cases.errors.addDesign'));
  return {
    categoryId,
    baseProductId: draft.modelId,
    name: draft.name.trim() || i18n.t('drafts.myDesign'),
    items: [{
      subCategoryId: artwork.subCategoryId,
      quantity: 1,
      position: 0,
      x: artwork.x,
      y: artwork.y,
      scale: artwork.scale,
      rotation: artwork.rotation,
      ...(artwork.imageUri ? { customDesignIndex: 0 } : {}),
    }],
  };
}

/**
 * The customer's photo for the multipart upload. A design reopened from My Designs points
 * at its stored file, which is sent again from there: the customer never uploads twice.
 */
const photoUris = () => {
  const uri = useCaseStore.getState().artwork?.imageUri;
  return uri ? [uri] : [];
};

function caseSignature(categoryId: string) {
  return JSON.stringify({ previewVersion: 'case-v1', product: caseInput(categoryId), uploads: photoUris() });
}

/**
 * Saves the case as a new CUSTOMER Product with its flattened preview. An unchanged design
 * reuses the last saved Product. Saving never touches the model's stock.
 */
export async function saveCaseDesign(
  userId: string,
  categoryId: string,
  capture: () => Promise<string>,
  createProduct: (formData: FormData) => Promise<SavedProduct>,
): Promise<SavedProduct> {
  const input = caseInput(categoryId);
  const signature = caseSignature(categoryId);
  const saved = useCaseStore.getState().saved;
  if (saved?.userId === userId && saved.signature === signature) return saved.product;
  const product = await createProduct(await productFormData(input, await capture(), undefined, photoUris()));
  useCaseStore.getState().markSaved({ userId, signature, product });
  return product;
}

/**
 * Opens a saved case in the studio with its model, image and placement restored.
 * Customers only order their own products, so an edit is saved as a new Product.
 */
export function loadCaseDesign(product: Pick<SavedProduct, 'categoryId' | 'name' | 'items' | 'baseProductId'
  | 'baseProduct'>, name = product.name) {
  const item = product.items?.[0];
  const imageUri = item?.customImageUrl ?? undefined;
  const artwork = item ? {
    subCategoryId: item.subCategoryId,
    x: item.x ?? 0.5,
    y: item.y ?? 0.5,
    scale: item.scale ?? 1,
    rotation: item.rotation ?? 0,
    ...(imageUri ? { imageUri } : {}),
    imageSize: null,
  } : null;
  useCaseStore.getState().load({
    categoryId: product.categoryId,
    modelId: product.baseProductId ?? product.baseProduct?.id ?? null,
    name,
    artwork,
    photo: artwork?.imageUri ? artwork : null,
  });
  useCaseStore.getState().markSaved(null);
}

/** Summary line parts for a case, e.g. ['iPhone 14', 'Your own photo']. */
export function caseMeta(t: TFunction, product: Pick<SavedProduct, 'baseProduct' | 'items'>) {
  const item = product.items?.[0];
  const design = !item ? null
    : item.customImageUrl || item.subCategory?.type === CUSTOM_UPLOAD ? t('cases.ownPhoto') : item.subCategory?.name;
  return [product.baseProduct?.name, design].filter((part): part is string => !!part);
}
