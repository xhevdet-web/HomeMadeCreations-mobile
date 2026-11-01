import i18n from '@/i18n';
import type { TFunction } from 'i18next';
import { parseTextLayers } from '@/api/builderModels';
import type { ProductInput, SavedProduct } from '@/api/commerceModels';
import { productFormData } from '@/api/endpoints/productSlice';
import { DEFAULT_TRANSFORM } from '@/helper/caseStudio';
import { MAX_MUG_ELEMENTS } from '@/helper/mugs';
import { useMugStore, type MugElement } from '@/store/mugStore';

/** An element's picture: the customer's upload, else the chosen design of ours. */
export const elementImage = (element: Pick<MugElement, 'imageUri' | 'designImageUrl'>) =>
  element.imageUri ?? element.designImageUrl;

/**
 * The design as a CUSTOMER product on the blank mug: one ProductItem per image with its
 * placement, in layer order (position), and its text. The backend prices it as the blank
 * mug; nothing here decides the price.
 */
export function mugInput(categoryId: string): ProductInput {
  const draft = useMugStore.getState();
  if (!draft.baseProductId) throw new Error(i18n.t('mugs.errors.notReady'));
  if (!draft.elements.length && !draft.texts.length) throw new Error(i18n.t('mugs.errors.addImage'));
  // Each upload is sent once per image, numbered among uploads only (see uploadUris).
  let upload = 0;
  return {
    categoryId,
    baseProductId: draft.baseProductId,
    name: draft.name.trim() || i18n.t('mugs.defaultName'),
    items: draft.elements.map((element, index) => ({
      subCategoryId: element.subCategoryId,
      quantity: 1,
      position: index,
      x: element.x,
      y: element.y,
      scale: element.scale,
      rotation: element.rotation,
      ...(element.imageUri ? { customDesignIndex: upload++ } : {}),
    })),
    textLayers: draft.texts,
  };
}

/** The uploaded images, in layer order (referenced by customDesignIndex). */
const uploadUris = () => useMugStore.getState().elements.flatMap((element) => element.imageUri ?? []);

function mugSignature(categoryId: string) {
  return JSON.stringify({ previewVersion: 'mug-v1', product: mugInput(categoryId), uploads: uploadUris() });
}

/**
 * Saves the design as a new CUSTOMER Product: the mug mockup as its picture and the flat
 * print as its second image (the print file). An unchanged design reuses the last saved
 * Product. Saving never touches the blank mugs' stock.
 */
export async function saveMugDesign(
  userId: string,
  categoryId: string,
  capture: () => Promise<{ mockup: string; print: string }>,
  createProduct: (formData: FormData) => Promise<SavedProduct>,
): Promise<SavedProduct> {
  const input = mugInput(categoryId);
  const signature = mugSignature(categoryId);
  const saved = useMugStore.getState().saved;
  if (saved?.userId === userId && saved.signature === signature) return saved.product;
  const { mockup, print } = await capture();
  const product = await createProduct(await productFormData(input, mockup, print, uploadUris()));
  useMugStore.getState().markSaved({ userId, signature, product });
  return product;
}

/**
 * Opens a saved mug in the Mug Studio with every image, placement and layer restored.
 * Customers only order their own products, so an edit is saved as a new Product.
 */
export function loadMugDesign(product: Pick<SavedProduct, 'categoryId' | 'name' | 'items' | 'baseProductId'
  | 'baseProduct' | 'textLayers'>, name = product.name) {
  const elements: MugElement[] = [...(product.items ?? [])]
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((item) => ({
      id: item.id,
      subCategoryId: item.subCategoryId,
      imageUri: item.customImageUrl ?? undefined,
      designImageUrl: item.customImageUrl ? undefined : item.subCategory?.imageUrl ?? undefined,
      imageSize: null,
      x: item.x ?? DEFAULT_TRANSFORM.x,
      y: item.y ?? DEFAULT_TRANSFORM.y,
      scale: item.scale ?? DEFAULT_TRANSFORM.scale,
      rotation: item.rotation ?? DEFAULT_TRANSFORM.rotation,
    }));
  useMugStore.getState().load({
    categoryId: product.categoryId,
    baseProductId: product.baseProductId ?? product.baseProduct?.id ?? null,
    name,
    elements,
    texts: parseTextLayers(product.textLayers),
  });
  useMugStore.getState().markSaved(null);
}

/** Summary line parts, e.g. ['Custom mug'], with the image count when a mug can have several. */
export function mugMeta(t: TFunction, product: Pick<SavedProduct, 'items'>) {
  return MAX_MUG_ELEMENTS > 1
    ? [t('mugs.customMug'), t('mugs.imageCount', { count: product.items?.length ?? 0 })]
    : [t('mugs.customMug')];
}
