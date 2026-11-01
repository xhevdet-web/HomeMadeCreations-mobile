import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetOrdersQuery } from '@/api/endpoints/orderSlice';
import { useMugStore } from '@/store/mugStore';
import { useStickerStore } from '@/store/stickerStore';
import { toast } from '@/store/toastStore';

/**
 * Once a studio's saved design has been ordered, the studio starts fresh. Checkout also
 * does this when it places the order; checking the customer's recent orders here covers
 * every other way back, e.g. an order placed on another visit. A design reopened from My
 * Designs isn't "saved" yet, so it is never cleared.
 */
function useResetOrderedDraft(savedId: string | undefined, reset: () => void, message: string) {
  const { data } = useGetOrdersQuery(1, { skip: !savedId });
  const ordered = !!savedId && !!data?.data.some((order) => order.productId === savedId);
  useEffect(() => {
    if (!ordered) return;
    reset();
    toast.info(message);
  }, [ordered]); // eslint-disable-line react-hooks/exhaustive-deps -- once per ordered design
}

/** The Sticker Studio: same shape and size, one empty design. */
export function useFreshStickerSet() {
  const { t } = useTranslation();
  const savedId = useStickerStore((state) => state.saved?.product.id);
  useResetOrderedDraft(savedId, () => useStickerStore.getState().startOver(t('stickers.defaultName')),
    t('stickers.freshSet'));
}

/** The Mug Studio: the same mug with an empty design. */
export function useFreshMugDesign() {
  const { t } = useTranslation();
  const savedId = useMugStore((state) => state.saved?.product.id);
  useResetOrderedDraft(savedId, () => useMugStore.getState().startOver(t('mugs.defaultName')), t('mugs.freshDesign'));
}
