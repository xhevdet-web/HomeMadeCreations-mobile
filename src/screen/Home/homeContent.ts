import type { CatalogCategory } from '@/api/catalogModels';
import { parseBuilderType, type BuilderType } from '@/api/builderModels';
import type { IconName } from '@/components/common/ui';

// Home's curated discovery content. It is frontend configuration keyed by a category's
// builderType (never its name), so new categories of a known studio appear automatically.
// Text lives in the translations (home.createLabels, home.occasions.*, home.ideas.*).

/** The studio a category opens; categories without a builderType use the jewelry studio. */
export const builderOf = (category: { builderType?: string | null }): BuilderType =>
  parseBuilderType(category.builderType) ?? 'JEWELRY';

export interface Occasion {
  /** Its text is home.occasions.<id>.title / .line */
  id: 'birthday' | 'anniversary' | 'thankYou' | 'justBecause' | 'someoneSpecial';
  icon: IconName;
  /** Studios that suit the occasion, best first. */
  builders: BuilderType[];
}

export const OCCASIONS: Occasion[] = [
  { id: 'birthday', icon: 'gift-outline', builders: ['GIFT', 'BOUQUET', 'JEWELRY'] },
  { id: 'anniversary', icon: 'heart-outline', builders: ['BOUQUET', 'JEWELRY', 'GIFT'] },
  { id: 'thankYou', icon: 'sparkles-outline', builders: ['BOUQUET', 'GIFT'] },
  { id: 'justBecause', icon: 'sunny-outline', builders: ['JEWELRY', 'APPAREL', 'BOUQUET', 'GIFT'] },
  { id: 'someoneSpecial', icon: 'rose-outline', builders: ['JEWELRY', 'BOUQUET', 'APPAREL'] },
];

/** One idea per studio; its text is home.ideas.<builder>.title / .line / .action */
export interface Idea {
  builder: BuilderType;
  icon: IconName;
}

export const IDEAS: Idea[] = [
  { builder: 'BOUQUET', icon: 'rose-outline' },
  { builder: 'GIFT', icon: 'gift-outline' },
  { builder: 'APPAREL', icon: 'shirt-outline' },
  { builder: 'JEWELRY', icon: 'diamond-outline' },
  { builder: 'CASE', icon: 'phone-portrait-outline' },
];

/** Active categories that open one of `builders`, in that order of preference. */
export function categoriesFor(categories: CatalogCategory[], builders: BuilderType[]) {
  return builders.flatMap((builder) => categories.filter((category) => builderOf(category) === builder));
}
