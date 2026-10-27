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
];

/** Active categories that open one of `builders`, in that order of preference. */
export function categoriesFor(categories: CatalogCategory[], builders: BuilderType[]) {
  return builders.flatMap((builder) => categories.filter((category) => builderOf(category) === builder));
}

/**
 * Up to `limit` items taking turns between groups (e.g. categories), so one large group
 * cannot fill the whole rail. Order inside each group is kept.
 */
export function takeTurns<T>(items: T[], groupOf: (item: T) => string, limit: number): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(groupOf(item), [...(groups.get(groupOf(item)) ?? []), item]);
  const queues = [...groups.values()];
  const picked: T[] = [];
  for (let round = 0; picked.length < limit && queues.some((queue) => queue.length > round); round++)
    for (const queue of queues)
      if (queue[round] !== undefined && picked.length < limit) picked.push(queue[round]);
  return picked;
}
