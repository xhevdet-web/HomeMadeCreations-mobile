import { router } from 'expo-router';
import { CatalogCategory } from '@/api/catalogModels';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';
import { isCanvasBuilder } from '@/helper/canvasStudio';
import { openCanvasStudio } from './canvasDesign';

// Each builderType opens its own studio; never infer the builder from the category name.
// JEWELRY (and legacy categories without a builderType): Choose Size → Jewelry Studio.
// BOUQUET / GIFT: Choose Size (when the category has sizes) → Bouquet or Gift Studio.
export function openCategory(category: CatalogCategory) {
  if (category.builderType === 'APPAREL') {
    // Category → all its garments → one garment's colour/size → design it or order plain.
    router.push({ pathname: '/apparel-garments', params: { categoryId: category.id } });
    return;
  }
  if (isCanvasBuilder(category.builderType) && !category.sizes?.length) {
    openCanvasStudio(category);
    return;
  }
  if (category.sizes?.length) {
    router.push({ pathname: '/choose-size', params: { categoryId: category.id } });
    return;
  }
  const productId = useCatalogStore.getState().registerCategory(category);
  useDesignStore.getState().start(productId);
  router.push({
    pathname: '/designer',
    params: { categoryId: category.id, category: category.name },
  });
}
