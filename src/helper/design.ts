import { DesignItem, JewelryType } from '@/types/models';
export const uniqueId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const normalizePositions = (items: DesignItem[]) =>
  items.map((item, position) => ({ ...item, position }));
export function itemPosition(index: number, count: number, type: JewelryType) {
  const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 160 + 111 * Math.cos(angle),
    y: 148 + (type === 'necklace' ? 119 : 96) * Math.sin(angle),
  };
}
