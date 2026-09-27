import { commerceApi, ProductInput, SavedProduct } from './commerceApi';
import { fetchCategory, fetchCategoryComponents } from './catalogApi';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';
import { useCommerceStore } from '@/store/commerceStore';
import { productById } from './catalog';
export function productInput(): ProductInput {
  const draft = useDesignStore.getState();
  const categoryId = productById[draft.productId]?.categoryId;
  if (!categoryId) throw new Error('Choose an API category to save this design.');
  if (!draft.items.length) throw new Error('Add at least one component.');
  // Consecutive runs preserve the design order, including repeated components.
  const items: ProductInput['items'] = [];
  for (const [position, entry] of draft.items.entries()) {
    const previous = items[items.length - 1];
    if (previous?.subCategoryId === entry.itemId) previous.quantity++;
    else items.push({ subCategoryId: entry.itemId, quantity: 1, position });
  }
  return {
    categoryId,
    name: draft.name.trim() || 'My design',
    description: draft.description.trim() || undefined,
    items,
  };
}
export async function saveCurrentDesign(userId: string): Promise<SavedProduct> {
  const input = productInput();
  const signature = JSON.stringify(input);
  const saved = useCommerceStore.getState().savedDraft;
  if (saved?.userId === userId && saved.signature === signature) return saved.product;
  const product = await commerceApi.save(input);
  useCommerceStore.getState().saveDraft(userId, signature, product);
  return product;
}
export async function editSavedDesign(id: string, userId: string) {
  const saved = await commerceApi.product(id);
  if (saved.createdById !== userId) throw new Error('This design belongs to another account.');
  if (saved.itemCount > 32) throw new Error('This design exceeds the studio limit of 32 beads.');
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
      imageUrl: null,
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
      size: productById[productId].sizes[1],
      items,
      updatedAt: new Date().toISOString(),
    });
  useCommerceStore.getState().saveDraft(userId, JSON.stringify(productInput()), saved);
}
