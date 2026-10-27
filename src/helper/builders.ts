import type { TFunction } from 'i18next';

const NOUNS = { BOUQUET: 'flower', GIFT: 'item', APPAREL: 'design' } as const;

/**
 * "8 beads", "5 flowers", "3 items": what a design's components are called. Takes the
 * caller's `t` so the text follows the current language when the screen re-renders.
 */
export function componentCount(t: TFunction, count: number, builderType?: string | null) {
  const noun = NOUNS[builderType as keyof typeof NOUNS] ?? 'bead';
  return t(`counts.${noun}`, { count });
}
