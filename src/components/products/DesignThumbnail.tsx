import { useEffect, useMemo } from 'react';
import type { SavedProduct } from '@/api/commerceModels';
import type { CatalogComponent } from '@/api/catalogModels';
import { JewelryCanvas } from '@/components/designer/JewelryCanvas';
import { useCatalogStore } from '@/store/catalogStore';
import type { DesignItem } from '@/types/models';
import { CatalogImage } from './CatalogImage';

type ThumbnailProduct = Pick<SavedProduct, 'name' | 'designPreviewUrl' | 'imageUrl' | 'items'> & {
  category?: { name?: string; builderType?: string | null; builderConfig?: unknown } | null;
};

/**
 * A customer design's picture: its captured preview, else its image. Jewelry designs
 * saved before previews were captured are drawn from their saved beads instead of
 * showing the empty placeholder.
 */
export function DesignThumbnail({ product, size }: { product: ThumbnailProduct; size: number }) {
  const url = product.designPreviewUrl ?? product.imageUrl;
  const jewelry = !product.category?.builderType || product.category.builderType === 'JEWELRY';
  const drawn = !url && jewelry && product.items?.length > 0;
  const config = product.category?.builderConfig as { silhouette?: string } | null | undefined;
  // builderConfig.silhouette decides the strand shape; the name is only a legacy fallback.
  const type = (config?.silhouette ? config.silhouette === 'NECKLACE' : /neck/i.test(product.category?.name ?? ''))
    ? 'necklace' : 'bracelet';
  const beads = useMemo<DesignItem[]>(() => {
    if (!drawn) return [];
    const ordered = [...product.items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return ordered.flatMap((item) => Array.from({ length: item.quantity }, (_, copy) => ({
      id: `${item.id}-${copy}`, itemId: item.subCategoryId, position: 0,
    }))).map((bead, position) => ({ ...bead, position }));
  }, [drawn, product.items]);

  // The canvas looks beads up in the catalog registry, so register the saved ones.
  useEffect(() => {
    if (!drawn) return;
    useCatalogStore.getState().registerComponents(product.items.map((item) => ({
      ...item.subCategory,
      id: item.subCategoryId,
      categoryId: item.subCategory.categoryId ?? '',
      color: item.subCategory.color ?? null,
      type: item.subCategory.type ?? null,
      price: item.unitPrice,
      stock: item.subCategory.stock ?? 0,
      isActive: item.subCategory.isActive ?? true,
    }) as CatalogComponent));
  }, [drawn, product.items]);

  return drawn
    ? <JewelryCanvas items={beads} type={type} size={size} exportMode />
    : <CatalogImage imageUrl={url} name={product.name} size={size} />;
}
