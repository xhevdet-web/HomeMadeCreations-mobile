import type { IconName } from '@/components/common/ui';
import type { BuilderType } from '@/api/builderModels';
import type { CatalogCategory } from '@/api/catalogModels';
import { builderOf } from '@/screen/Home/homeContent';

export type CategoryGroupId = 'all' | 'jewelry' | 'apparel' | 'printed' | 'gifts';

/** Filter chips on Categories. A group's label is categories.groups.<id>. */
export const CATEGORY_GROUPS: { id: Exclude<CategoryGroupId, 'all'>; icon: IconName; builders: BuilderType[] }[] = [
  { id: 'jewelry', icon: 'diamond-outline', builders: ['JEWELRY'] },
  { id: 'apparel', icon: 'shirt-outline', builders: ['APPAREL'] },
  { id: 'printed', icon: 'color-palette-outline', builders: ['MUG', 'CASE', 'STICKER'] },
  { id: 'gifts', icon: 'gift-outline', builders: ['GIFT', 'BOUQUET'] },
];

export function inGroup(category: CatalogCategory, group: CategoryGroupId) {
  if (group === 'all') return true;
  return CATEGORY_GROUPS.find((item) => item.id === group)?.builders.includes(builderOf(category)) ?? false;
}

// Lower case without accents, so "kemishe" finds "Këmishë".
const fold = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function matchesSearch(category: CatalogCategory, query: string) {
  const needle = fold(query);
  return !needle || fold(`${category.name} ${category.description ?? ''}`).includes(needle);
}
