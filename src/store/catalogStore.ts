import type { SavedProduct } from '@/api/commerceModels';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { itemById, productById, products } from '@/services/catalog';
import { CatalogCategory, CatalogComponent } from '@/api/catalogModels';
import { CustomizationItem, Product } from '@/types/models';
import { storage } from './storage';

// Keep API metadata available to the existing canvas, saved designs and pricing
// after an app restart. The picker always fetches current availability separately.
export const useCatalogStore = create<{
  products: Record<string, Product>;
  items: Record<string, CustomizationItem>;
  registerCategory: (category: CatalogCategory) => string;
  registerComponents: (components: CatalogComponent[]) => CustomizationItem[];
  registerSavedProduct: (product: SavedProduct) => Product;
}>()(
  persist((set, get) => ({
    products: {}, items: {},
    registerCategory: (category) => {
      // The API has no canvas geometry field; reuse the existing necklace or
      // bracelet template, with bracelet as the default for other categories.
      // builderConfig.silhouette decides the strand shape; the name is only a legacy fallback.
      const silhouette = category.builderConfig?.silhouette;
      const necklace = silhouette ? silhouette === 'NECKLACE' : /neck/i.test(category.name);
      const template = products.find((product) => product.type ===
        (necklace ? 'necklace' : 'bracelet'))!;
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
    registerSavedProduct: (product) => registerProduct(product),
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
