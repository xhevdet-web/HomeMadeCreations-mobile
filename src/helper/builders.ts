const NOUNS: Record<string, [string, string]> = {
  BOUQUET: ['flower', 'flowers'],
  GIFT: ['item', 'items'],
  APPAREL: ['design', 'designs'],
};

/** "8 beads", "5 flowers", "3 items": what a design's components are called. */
export function componentCount(count: number, builderType?: string | null) {
  const [one, many] = NOUNS[builderType ?? ''] ?? ['bead', 'beads'];
  return `${count} ${count === 1 ? one : many}`;
}
