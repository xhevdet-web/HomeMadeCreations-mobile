import productData from '@/data/products.json';
import beadData from '@/data/beads.json';
import charmData from '@/data/charms.json';
import { CustomizationItem, DesignItem, Product } from '@/types/models';

// The catalog boundary can be replaced with a REST repository without changing UI models.
export const products = productData as Product[];
export const beads = beadData as CustomizationItem[];
export const charms = charmData as CustomizationItem[];
export const letters: CustomizationItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  .split('')
  .map((letter) => ({
    id: `letter-${letter}`,
    name: `Letter ${letter}`,
    type: 'letter',
    color: 'Gold',
    hex: '#D0AD71',
    material: 'Metal',
    shape: 'Disc',
    price: 80,
    currency: 'EUR',
    image: `procedural:letter-${letter}`,
    available: true,
    stock: 50,
    symbol: letter,
  }));
export const items = [...beads, ...charms, ...letters];
export const itemById = Object.fromEntries(items.map((item) => [item.id, item]));
export const productById = Object.fromEntries(products.map((product) => [product.id, product]));
export function sampleItems(product: Product, count = 20): DesignItem[] {
  return Array.from({ length: count }, (_, position) => ({
    id: `sample-${position}`,
    itemId: product.palette[position % product.palette.length],
    position,
  }));
}
