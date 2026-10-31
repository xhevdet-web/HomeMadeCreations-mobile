import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetOrdersQuery } from '@/api/endpoints/orderSlice';
import { useStickerStore } from '@/store/stickerStore';
import { toast } from '@/store/toastStore';

/**
 * Once the set in the Sticker Studio has been ordered, the studio starts fresh (same shape
 * and size, one empty design). Checkout also does this when it places the order; checking
 * the customer's recent orders here covers every other way back, e.g. an order placed on
 * another visit. A set reopened from My Designs isn't "saved" yet, so it is never cleared.
 */
export function useFreshStickerSet() {
  const { t } = useTranslation();
  const savedId = useStickerStore((state) => state.saved?.product.id);
  const { data } = useGetOrdersQuery(1, { skip: !savedId });
  const ordered = !!savedId && !!data?.data.some((order) => order.productId === savedId);
  useEffect(() => {
    if (!ordered) return;
    useStickerStore.getState().startOver(t('stickers.defaultName'));
    toast.info(t('stickers.freshSet'));
  }, [ordered, t]);
}
