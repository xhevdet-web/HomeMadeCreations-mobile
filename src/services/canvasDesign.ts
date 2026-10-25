import { router } from 'expo-router';
import type { CanvasPlacement } from '@/api/builderModels';
import { parseTextLayers } from '@/api/builderModels';
import type { CatalogCategory } from '@/api/catalogModels';
import type { ProductInput, SavedProduct } from '@/api/commerceModels';
import { productFormData } from '@/api/endpoints/productSlice';
import { isCanvasBuilder, type CanvasBuilder } from '@/helper/canvasStudio';
import { uniqueId } from '@/helper/design';
import { useCanvasStore, type CanvasBase } from '@/store/canvasStore';

/** Bouquets and gifts: composed freely on one canvas. */
export function isCanvasProduct(product: { category?: { builderType?: string | null } | null }) {
  return isCanvasBuilder(product.category?.builderType);
}

/** Opens the Bouquet or Gift Studio on a base product (or an empty canvas without one). */
export function openCanvasStudio(category: Pick<CatalogCategory, 'id' | 'name' | 'builderType'>,
  base: CanvasBase | null, replace = false) {
  if (!isCanvasBuilder(category.builderType)) return;
  useCanvasStore.getState().start({
    builderType: category.builderType,
    categoryId: category.id,
    categoryName: category.name,
    base,
  });
  if (replace) router.replace('/studio');
  else router.push('/studio');
}

const round = (value: number) => Math.round(value * 10000) / 10000;

/**
 * One ProductItem per placed piece: 5 roses are 5 items with their own position, size and
 * rotation, still priced and stocked as "Rose × 5". `position` is the layer order
 * (back → front). The backend prices everything from its own catalog.
 */
export function canvasInput(): ProductInput {
  const draft = useCanvasStore.getState();
  if (!draft.categoryId) throw new Error('Choose a category to start designing.');
  // Text is a studio tool, never a stocked component; array order is its layer order.
  const texts = draft.texts.filter((layer) => layer.text.trim()).map((layer) => ({
      ...layer,
      text: layer.text.trim(),
      x: round(layer.x),
      y: round(layer.y),
      scale: round(layer.scale),
      rotation: Math.round(layer.rotation),
    }));
  return {
    categoryId: draft.categoryId,
    name: draft.name.trim() || `My ${draft.categoryName}`,
    ...(draft.base ? { baseProductId: draft.base.id } : {}),
    items: draft.placements.map((placement, position) => ({
      subCategoryId: placement.subCategoryId,
      quantity: 1,
      position,
      x: round(placement.x),
      y: round(placement.y),
      scale: round(placement.scale),
      rotation: Math.round(placement.rotation),
    })),
    ...(texts.length ? { textLayers: texts } : {}),
  };
}

export function canvasSignature() {
  return JSON.stringify({ previewVersion: 'canvas-v2', product: canvasInput() });
}

/**
 * Saves the composition as a new Product with a clean captured preview. Stock is not
 * touched: it is only reserved when an order is placed. An unchanged design reuses the
 * last saved Product instead of uploading again.
 */
export async function saveCanvasDesign(
  userId: string,
  capture: () => Promise<string>,
  createProduct: (formData: FormData) => Promise<SavedProduct>,
): Promise<SavedProduct> {
  const input = canvasInput();
  if (!input.items.length) throw new Error('Add at least one item to your design.');
  const signature = canvasSignature();
  const saved = useCanvasStore.getState().saved;
  if (saved?.userId === userId && saved.signature === signature) return saved.product;
  const product = await createProduct(await productFormData(input, await capture()));
  useCanvasStore.getState().markSaved({ userId, signature, product });
  return product;
}

/**
 * Opens a saved bouquet or gift in its studio with every position, layer and text
 * restored. Customers only order their own products, so edits save as a new Product.
 */
export function loadCanvasDesign(product: Pick<SavedProduct, 'categoryId' | 'name' | 'items' | 'baseProduct'> & {
  category?: { name: string; builderType?: string | null } | null;
  textLayers?: unknown;
}, name = product.name) {
  const builderType = product.category?.builderType;
  if (!isCanvasBuilder(builderType)) throw new Error('This design cannot be opened in the studio.');
  const items = [...(product.items ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const placements: CanvasPlacement[] = [];
  for (const item of items)
    for (let copy = 0; copy < Math.max(item.quantity, 1); copy++)
      placements.push({
        id: uniqueId(),
        subCategoryId: item.subCategoryId,
        // Older designs without positions are spread out instead of stacked.
        x: item.x ?? 0.5 + ((placements.length % 3) - 1) * 0.12,
        y: item.y ?? 0.45 + (Math.floor(placements.length / 3) % 3) * 0.08,
        scale: item.scale ?? 1,
        rotation: item.rotation ?? 0,
      });
  useCanvasStore.getState().load({
    builderType: builderType as CanvasBuilder,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? '',
    base: product.baseProduct ? {
      id: product.baseProduct.id,
      name: product.baseProduct.name,
      price: product.baseProduct.price ?? 0,
      imageUrl: product.baseProduct.imageUrl,
    } : null,
    name,
    placements,
    texts: parseTextLayers(product.textLayers),
  });
  useCanvasStore.getState().markSaved(null);
}

/** "3 × Pink Rose" lines: one per component, in first-placed order. */
export function componentLines<T extends { subCategoryId: string }>(
  placements: T[], info: (subCategoryId: string) => { name: string; price: number; imageUrl?: string | null }) {
  const lines = new Map<string, { subCategoryId: string; name: string; quantity: number; unitPrice: number;
    imageUrl?: string | null }>();
  for (const placement of placements) {
    const line = lines.get(placement.subCategoryId);
    if (line) line.quantity += 1;
    else {
      const component = info(placement.subCategoryId);
      lines.set(placement.subCategoryId, { subCategoryId: placement.subCategoryId, name: component.name,
        quantity: 1, unitPrice: component.price, imageUrl: component.imageUrl });
    }
  }
  return [...lines.values()];
}

/** Saved ProductItems grouped the same way, priced from their snapshots. */
export function savedComponentLines(product: Pick<SavedProduct, 'items'>) {
  const lines = new Map<string, { key: string; name: string; quantity: number; unitPrice: number }>();
  for (const item of product.items ?? []) {
    const key = item.subCategoryId + ':' + item.unitPrice;
    const line = lines.get(key);
    if (line) line.quantity += item.quantity;
    else lines.set(key, { key, name: item.subCategory.name, quantity: item.quantity, unitPrice: item.unitPrice });
  }
  return [...lines.values()];
}
