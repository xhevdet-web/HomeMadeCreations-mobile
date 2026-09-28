import type { SavedProduct } from '@/services/commerceApi';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { itemById, productById, products } from '@/services/catalog';
import { CatalogCategory, CatalogComponent, fetchProducts, fetchProduct } from '@/services/catalogApi';
import { CustomizationItem, Product } from '@/types/models';
import { storage } from './storage';

// Keep API metadata available to the existing canvas, saved designs and pricing
// after an app restart. The picker always fetches current availability separately.
export const useCatalogStore = create<{
  products: Record<string, Product>;
  items: Record<string, CustomizationItem>;
  registerCategory: (category: CatalogCategory) => string;
  registerComponents: (components: CatalogComponent[]) => CustomizationItem[];
}>()(
  persist((set, get) => ({
    products: {}, items: {},
    registerCategory: (category) => {
      // The API has no canvas geometry field; reuse the existing necklace or
      // bracelet template, with bracelet as the default for other categories.
      const template = products.find((product) => product.type ===
        (/neck/i.test(category.name) ? 'necklace' : 'bracelet'))!;
      const product: Product = { ...template, id: `category:${category.id}`,
        categoryId: category.id, categorySizes: category.sizes ?? [], name: category.name, description: category.description ?? '',
        basePrice: 0, palette: [], imageUrl: category.imageUrl, imageKey: category.imageKey, available: category.isActive };
      productById[product.id] = product;
      set({ products: { ...get().products, [product.id]: product } });
      return product.id;
    },
    registerComponents: (components) => {
      const mapped = components.map((component): CustomizationItem => ({
        id: component.id, categoryId: component.categoryId, name: component.name,
        type: 'bead', componentType: component.type ?? 'Not specified',
        color: component.color ?? 'Not specified', hex: '#D0AD71',
        material: component.type ?? 'Not specified', shape: 'Round',
        price: component.price, currency: 'EUR', image: 'bundled:bead', imageUrl: component.imageUrl, imageKey: component.imageKey,
        available: component.isActive && component.stock > 0, stock: component.stock,
      }));
      const entries = Object.fromEntries(mapped.map((item) => [item.id, item]));
      Object.assign(itemById, entries);
      set({ items: { ...get().items, ...entries } });
      return mapped;
    },
  }), {
    name: 'homemade-catalog-v1', storage,
    onRehydrateStorage: () => (state) => {
      if (state) {
        Object.assign(itemById, state.items);
        Object.assign(productById, state.products);
      }
    },
  }),
);

function registerProduct(saved: SavedProduct): Product {
  const template = products.find((product) => product.type ===
    (/neck/i.test(saved.category?.name ?? '') ? 'necklace' : 'bracelet'))!;
  const product: Product = { ...template, id: saved.id, categoryId: saved.categoryId,
    name: saved.name, description: saved.description ?? '', imageUrl: saved.imageUrl,
    imageKey: saved.imageKey, price: saved.price, basePrice: 0, palette: [], tag: undefined,
    available: saved.isActive !== false };
  productById[product.id] = product;
  useCatalogStore.setState((state) => ({ products: { ...state.products, [product.id]: product } }));
  return product;
}
export const loadProducts = async (signal: AbortSignal) => {
  const products = await fetchProducts(signal);
  return signal.aborted ? [] : products.map(registerProduct);
};
export const loadProduct = async (id: string, signal: AbortSignal) => {
  const product = await fetchProduct(id, signal);
  return signal.aborted ? undefined : registerProduct(product);
};
