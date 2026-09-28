import { commerceApi, ProductInput, SavedProduct } from './commerceApi';
import { fetchCategory, fetchCategoryComponents, parseCategorySize } from './catalogApi';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';
import { useCommerceStore } from '@/store/commerceStore';
import { productById } from './catalog';
export function productInput(): ProductInput {
  const draft = useDesignStore.getState();
  const categoryId = productById[draft.productId]?.categoryId;
  if (!categoryId) throw new Error('Choose an API category to save this design.');
  if (!draft.items.length) throw new Error('Add at least one component.');
  if (productById[draft.productId]?.categorySizes?.length && !draft.selectedSize)
    throw new Error('Choose a category size before saving your design.');
  if (draft.selectedSize && draft.items.length > draft.selectedSize.maxItems)
    throw new Error(`${draft.selectedSize.name} supports up to ${draft.selectedSize.maxItems} components. Remove extra components before saving.`);
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
    name: draft.name.trim() || 'My design',
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
): Promise<SavedProduct> {
  const input = productInput();
  const signature = designSignature();
  const saved = useCommerceStore.getState().savedDraft;
  if (saved?.userId === userId && saved.signature === signature && saved.product.designPreviewUrl)
    return saved.product;
  const previewUri = await capturePreview();
  const product = await commerceApi.save(input, previewUri);
  useCommerceStore.getState().saveDraft(userId, signature, product);
  return product;
}
export async function editSavedDesign(id: string, userId: string) {
  const saved = await commerceApi.product(id);
  if (saved.createdById !== userId) throw new Error('This design belongs to another account.');
  const selectedSize = saved.selectedSize == null ? null : parseCategorySize(saved.selectedSize);
  const [category, components] = await Promise.all([
    fetchCategory(saved.categoryId),
    fetchCategoryComponents(saved.categoryId),
  ]);
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
      id: saved.id,
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
