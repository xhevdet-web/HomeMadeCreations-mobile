import type { ProductInput, SavedProduct } from '@/api/commerceModels';
import i18n from '@/i18n';
import { parseCategorySize } from '@/api/catalogModels';
import { productFormData, productSlice } from '@/api/endpoints/productSlice';
import { categorySlice } from '@/api/endpoints/categorySlice';
import { subCategorySlice } from '@/api/endpoints/subCategorySlice';
import { apiStore } from '@/api/store';
import { apiError } from '@/api/apiSlice';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';
import { useCommerceStore } from '@/store/commerceStore';
import { productById } from './catalog';
import { uniqueId } from '@/helper/design';
export function productInput(): ProductInput {
  const draft = useDesignStore.getState();
  const categoryId = productById[draft.productId]?.categoryId;
  if (!categoryId) throw new Error(i18n.t('designErrors.chooseCategory'));
  if (!draft.items.length) throw new Error(i18n.t('designErrors.addComponent'));
  if (productById[draft.productId]?.categorySizes?.length && !draft.selectedSize)
    throw new Error(i18n.t('designErrors.chooseSize'));
  if (draft.selectedSize && draft.items.length > draft.selectedSize.maxItems)
    throw new Error(i18n.t('designErrors.tooManyComponents', { size: draft.selectedSize.name, max: draft.selectedSize.maxItems }));
  // Consecutive runs preserve the design order, including repeated components.
  const items: ProductInput['items'] = [];
  for (const [position, entry] of draft.items.entries()) {
    const previous = items[items.length - 1];
    if (previous?.subCategoryId === entry.itemId) previous.quantity++;
    else items.push({ subCategoryId: entry.itemId, quantity: 1, position });
  }
  return {
    categoryId,
    ...(draft.selectedSize ? { selectedSizeId: draft.selectedSize.id } : {}),
    name: draft.name.trim() || i18n.t('drafts.myDesign'),
    description: draft.description.trim() || undefined,
    items,
  };
}
export function designSignature(): string {
  const items = useDesignStore.getState().items;
  return JSON.stringify({
    previewVersion: 'transparent-png-v1',
    product: productInput(),
    visual: items.map(({ itemId, angle, position }) => ({ itemId, angle, position })),
  });
}
export async function saveCurrentDesign(
  userId: string,
  capturePreview: () => Promise<string>,
  createProduct: (formData: FormData) => Promise<SavedProduct>,
): Promise<SavedProduct> {
  const input = productInput();
  const signature = designSignature();
  const saved = useCommerceStore.getState().savedDraft;
  if (saved?.userId === userId && saved.signature === signature && saved.product.designPreviewUrl)
    return saved.product;
  const previewUri = await capturePreview();
  const product = await createProduct(await productFormData(input, previewUri));
  useCommerceStore.getState().saveDraft(userId, signature, product);
  return product;
}
export async function editSavedDesign(id: string, userId: string) {
  const request = apiStore.dispatch(productSlice.endpoints.getOwnedProductById.initiate(id, { forceRefetch: true }));
  let saved: SavedProduct;
  try { saved = await request.unwrap(); } catch (error) { throw apiError(error); }
  finally { request.unsubscribe(); }
  if (saved.createdById !== userId) throw new Error(i18n.t('designErrors.otherAccount'));
  await loadIntoStudio(saved, userId, saved.id);
}

type DesignSource = Pick<SavedProduct,
  'categoryId' | 'name' | 'description' | 'selectedSize' | 'items'>;

/**
 * Starts a new design from another customer's finished creation. Customers can only
 * order their own products, so the copy is saved as the buyer's new Product when they
 * continue to delivery, using today's bead prices and stock.
 */
export async function copyCreation(product: DesignSource, userId: string) {
  if (!product.items?.length) throw new Error(i18n.t('designErrors.nothingToCopy'));
  await loadIntoStudio(product, userId, uniqueId());
}

async function loadIntoStudio(saved: DesignSource, userId: string, designId: string) {
  const selectedSize = saved.selectedSize == null ? null : parseCategorySize(saved.selectedSize);
  const categoryRequest = apiStore.dispatch(categorySlice.endpoints.getCategoryById.initiate(saved.categoryId, { forceRefetch: true }));
  const componentRequest = apiStore.dispatch(subCategorySlice.endpoints.getCategoryComponents.initiate(saved.categoryId, { forceRefetch: true }));
  let category, components;
  try {
    [category, components] = await Promise.all([categoryRequest.unwrap(), componentRequest.unwrap()]);
  } catch (error) { throw apiError(error); }
  finally { categoryRequest.unsubscribe(); componentRequest.unsubscribe(); }
  const registry = useCatalogStore.getState();
  const productId = registry.registerCategory(category);
  registry.registerComponents(
    saved.items.map((item) => ({
      id: item.subCategoryId,
      categoryId: saved.categoryId,
      name: item.subCategory.name,
      description: null,
      imageUrl: item.subCategory.imageUrl,
      imageKey: item.subCategory.imageKey,
      color: item.subCategory.color ?? null,
      type: item.subCategory.type ?? null,
      price: item.unitPrice,
      stock: 0,
      isActive: false,
      sortOrder: 0,
    })),
  );
  registry.registerComponents(components);
  const items = saved.items
    .flatMap((item) =>
      Array.from({ length: item.quantity }, (_, index) => ({
        id: item.id + '-' + index,
        itemId: item.subCategoryId,
        position: 0,
      })),
    )
    .map((item, position) => ({ ...item, position }));
  useDesignStore
    .getState()
    .load({
      id: designId,
      userId,
      productId,
      name: saved.name,
      description: saved.description ?? '',
      selectedSize,
      size: selectedSize ? `${selectedSize.name} • ${selectedSize.measurement} ${selectedSize.unit}` : '',
      items,
      updatedAt: new Date().toISOString(),
    });
  // Customer edits always save a new Product; PATCH is currently admin-only.
  useCommerceStore.getState().clearDraft();
}
