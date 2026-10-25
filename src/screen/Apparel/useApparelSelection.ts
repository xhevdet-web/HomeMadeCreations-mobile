import { useGetCategoryByIdQuery } from '@/api/endpoints/categorySlice';
import { useGetProductsQuery } from '@/api/endpoints/productSlice';
import { useApiResult } from '@/api/useApiResult';
import type { CatalogCategory } from '@/api/catalogModels';
import type { SavedProduct } from '@/api/commerceModels';
import type { ApparelLook } from '@/api/apparelModels';
import { useApparelStore } from '@/store/apparelStore';
import { pieceColor } from '@/services/apparelDesign';

/**
 * The category, its company products (the bases a design can be printed on) and the
 * draft's chosen base and size. Shared by the base picker and the studio so both always
 * describe the same piece.
 */
export function useApparelSelection(categoryId: string) {
  const category = useApiResult<CatalogCategory>(useGetCategoryByIdQuery(categoryId, { skip: !categoryId }));
  const bases = useApiResult<SavedProduct[]>(
    useGetProductsQuery({ categoryId, origin: 'COMPANY' }, { skip: !categoryId }));
  const baseProductId = useApparelStore((state) => state.baseProductId);
  const size = useApparelStore((state) => state.size);
  const base = bases.data?.find((entry) => entry.id === baseProductId);
  const look: ApparelLook | null = base
    ? {
        imageUrl: base.imageUrl,
        backImageUrl: base.backImageUrl,
        printAreas: base.printAreas,
        colorHex: base.colorHex,
        silhouette: category.data?.builderConfig?.silhouette,
      }
    : null;
  return {
    category: category.data,
    categoryResult: category,
    bases: bases.data ?? [],
    basesResult: bases,
    base,
    look,
    size,
    color: pieceColor(base),
    price: base?.price ?? 0,
  };
}
