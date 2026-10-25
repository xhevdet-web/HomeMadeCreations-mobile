import type { CatalogCategory } from '@/api/catalogModels';
import { parseBuilderType, type BuilderType } from '@/api/builderModels';
import type { IconName } from '@/components/common/ui';

// Home's curated discovery content. It is frontend configuration keyed by a category's
// builderType (never its name), so new categories of a known studio appear automatically.

/** The studio a category opens; categories without a builderType use the jewelry studio. */
export const builderOf = (category: { builderType?: string | null }): BuilderType =>
  parseBuilderType(category.builderType) ?? 'JEWELRY';

/** Short action line under a category on Home. */
export const CREATE_LABELS: Record<BuilderType, string> = {
  JEWELRY: 'Design your own',
  BOUQUET: 'Arrange your own',
  GIFT: 'Build your own',
  APPAREL: 'Customize yours',
};

export interface Occasion {
  id: string;
  title: string;
  line: string;
  icon: IconName;
  /** Studios that suit the occasion, best first. */
  builders: BuilderType[];
}

export const OCCASIONS: Occasion[] = [
  { id: 'birthday', title: 'Birthday', line: 'For their special day', icon: 'gift-outline',
    builders: ['GIFT', 'BOUQUET', 'JEWELRY'] },
  { id: 'anniversary', title: 'Anniversary', line: 'Make it personal', icon: 'heart-outline',
    builders: ['BOUQUET', 'JEWELRY', 'GIFT'] },
  { id: 'thank-you', title: 'Thank you', line: 'A small way to say thanks', icon: 'sparkles-outline',
    builders: ['BOUQUET', 'GIFT'] },
  { id: 'just-because', title: 'Just because', line: 'No occasion needed', icon: 'sunny-outline',
    builders: ['JEWELRY', 'APPAREL', 'BOUQUET', 'GIFT'] },
  { id: 'someone-special', title: 'For someone special', line: 'Create something just for them',
    icon: 'rose-outline', builders: ['JEWELRY', 'BOUQUET', 'APPAREL'] },
];

export interface Idea {
  builder: BuilderType;
  title: string;
  line: string;
  action: string;
  icon: IconName;
}

export const IDEAS: Idea[] = [
  { builder: 'BOUQUET', title: 'Flowers for someone special', line: 'Arrange a bouquet made by you.',
    action: 'Start creating', icon: 'rose-outline' },
  { builder: 'GIFT', title: 'Build the perfect gift', line: 'Choose what goes inside and make it personal.',
    action: 'Create a gift', icon: 'gift-outline' },
  { builder: 'APPAREL', title: 'Wear your idea', line: 'Turn something you love into a piece to wear.',
    action: 'Customize', icon: 'shirt-outline' },
  { builder: 'JEWELRY', title: 'Make your own jewelry', line: 'Choose every bead and detail yourself.',
    action: 'Start designing', icon: 'diamond-outline' },
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
