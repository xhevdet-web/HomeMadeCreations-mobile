import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { itemById, productById, products } from '@/services/catalog';
import { CatalogCategory, CatalogComponent } from '@/services/catalogApi';
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
        categoryId: category.id, name: category.name, description: category.description ?? '',
        basePrice: 0, palette: [], available: category.isActive };
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
        price: component.price, currency: 'EUR', image: 'bundled:bead', imageUrl: component.imageUrl,
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
