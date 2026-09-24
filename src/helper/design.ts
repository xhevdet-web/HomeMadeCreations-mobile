import { DesignItem, JewelryType } from '@/types/models';
export const uniqueId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export const normalizePositions = (items: DesignItem[]) =>
  items.map((item, position) => ({ ...item, position }));
export function itemPosition(index: number, count: number, type: JewelryType, placement?: number) {
  const angle = (placement ?? index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
  return {
    x: 160 + 111 * Math.cos(angle),
    y: 148 + (type === 'necklace' ? 119 : 96) * Math.sin(angle),
  };
}
export function angleFromPoint(x: number, y: number, type: JewelryType) {
  const verticalRadius = type === 'necklace' ? 119 : 96;
  const radians = Math.atan2((y - 148) / verticalRadius, (x - 160) / 111);
  return ((radians + Math.PI / 2) / (Math.PI * 2) + 1) % 1;
}
