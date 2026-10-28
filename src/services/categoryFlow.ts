import { router } from 'expo-router';
import { CatalogCategory } from '@/api/catalogModels';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';
import { isCanvasBuilder } from '@/helper/canvasStudio';

/** A category opens its products, with "Create your own design" first. */
export function openCategory(category: Pick<CatalogCategory, 'id'>) {
  router.push({ pathname: '/category', params: { categoryId: category.id } });
}

// "Create your own design" opens the studio of the category's builderType; never infer
// the builder from the category name.
// JEWELRY (and legacy categories without a builderType): Choose Size → Jewelry Studio.
// BOUQUET / GIFT: Choose your base product → free Bouquet or Gift Studio.
// APPAREL: Choose your base product and size → Apparel Studio.
// CASE: Choose your phone → Case Studio.
export function startDesign(category: CatalogCategory) {
  if (category.builderType === 'CASE') {
    router.push({ pathname: '/case-model', params: { categoryId: category.id } });
    return;
  }
  if (category.builderType === 'APPAREL') {
    router.push({ pathname: '/apparel-base', params: { categoryId: category.id } });
    return;
  }
  if (isCanvasBuilder(category.builderType)) {
    router.push({ pathname: '/design-base', params: { categoryId: category.id } });
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
