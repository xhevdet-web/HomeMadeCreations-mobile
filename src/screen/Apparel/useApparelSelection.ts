import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useGetCategoryGarmentsQuery } from '@/api/endpoints/garmentSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import { variantPrice, type Garment } from '@/api/garmentModels';
import { useApparelStore } from '@/store/apparelStore';
import { garmentColor } from '@/services/apparelDesign';

/**
 * The category, garments and current garment/variant of an apparel draft. Shared by the
 * setup screen and the studio so both always describe the same piece.
 */
export function useApparelSelection(categoryId: string) {
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  const garments = useApiResult<Garment[]>(useGetCategoryGarmentsQuery(categoryId, { skip: !categoryId }));
  const garmentId = useApparelStore((state) => state.garmentId);
  const variantId = useApparelStore((state) => state.variantId);
  const garment = garments.data?.find((entry) => entry.id === garmentId);
  const variant = garment?.variants.find((entry) => entry.id === variantId);
  return {
    category: category.data,
    categoryResult: category,
    garments: garments.data ?? [],
    garmentsResult: garments,
    garment,
    variant,
    color: garmentColor(variant ?? garment?.variants[0]),
    price: garment ? variantPrice(garment, variant) : 0,
  };
}
