import { router } from 'expo-router';
import { CatalogCategory } from '@/api/catalogModels';
import { useCatalogStore } from '@/store/catalogStore';
import { useDesignStore } from '@/store/designStore';

// Category → Choose Size (when the category has sizes) → Builder.
export function openCategory(category: CatalogCategory) {
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
