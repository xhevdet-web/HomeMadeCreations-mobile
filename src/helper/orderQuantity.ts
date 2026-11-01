import { MAX_MUGS_PER_ORDER, MUG_BUILDER } from '@/helper/mugs';
import { MAX_STICKERS_PER_DESIGN, MIN_STICKERS_PER_ORDER } from '@/helper/stickers';

/**
 * How many of a product one order may hold, or null when it is ordered one at a time. The
 * same rule as the API: ready-made stickers from five, mugs (ready-made or designed) by the
 * piece. A sticker set carries its own quantities, so it is ordered once.
 */
export function orderQuantityRule(product: { origin?: string; category?: { builderType?: string | null } | null }) {
  const builder = product.category?.builderType;
  if (builder === 'STICKER' && product.origin === 'COMPANY')
    return { min: MIN_STICKERS_PER_ORDER, max: MAX_STICKERS_PER_DESIGN };
  if (builder === MUG_BUILDER) return { min: 1, max: MAX_MUGS_PER_ORDER };
  return null;
}
