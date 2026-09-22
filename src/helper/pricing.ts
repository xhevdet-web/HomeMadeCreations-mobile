import { DesignItem, OrderItem } from '@/types/models';
import { itemById } from '@/services/catalog';

export const money = (cents: number) => `€${(cents / 100).toFixed(2)}`;
export function priceLines(items: DesignItem[]): OrderItem[] {
  const lines = new Map<string, OrderItem>();
  for (const entry of items) {
    const item = itemById[entry.itemId];
    if (!item) continue;
    const line = lines.get(item.id);
    if (line) line.quantity += 1;
    else
      lines.set(item.id, { itemId: item.id, name: item.name, quantity: 1, unitPrice: item.price });
  }
  return [...lines.values()];
}
export const designPrice = (basePrice: number, items: DesignItem[]) =>
  basePrice + priceLines(items).reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
