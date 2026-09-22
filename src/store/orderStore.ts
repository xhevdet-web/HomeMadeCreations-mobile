import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Address, Design, Order } from '@/types/models';
import { productById } from '@/services/catalog';
import { designPrice, priceLines } from '@/helper/pricing';
import { uniqueId } from '@/helper/design';
import { DELIVERY_PRICE } from '@/constants/theme';
import { storage } from './storage';
interface OrderState {
  orders: Order[];
  place: (design: Design, address: Address, email: string) => Order;
}
export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      place: (design, address, email) => {
        const product = productById[design.productId];
        const total = designPrice(product.basePrice, design.items);
        const order: Order = {
          id: uniqueId(),
          userId: design.userId,
          number: `HM-${new Date().getFullYear()}-${String(get().orders.length + 1).padStart(5, '0')}`,
          createdAt: new Date().toISOString(),
          status: 'Pending',
          designs: [
            {
              design: JSON.parse(JSON.stringify(design)) as Design,
              productName: product.name,
              basePrice: product.basePrice,
              items: priceLines(design.items),
              total,
            },
          ],
          address: { ...address },
          email,
          delivery: DELIVERY_PRICE,
          total: total + DELIVERY_PRICE,
        };
        set({ orders: [order, ...get().orders] });
        return order;
      },
    }),
    { name: 'homemade-orders-v1', storage },
  ),
);
