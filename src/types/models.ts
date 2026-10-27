export type JewelryType = 'bracelet' | 'necklace';
/**
 * A studio size. Bracelets: a length range in millimetres, plus the exact length chosen
 * (`selectedMeasurementMm`) once a design is made. Necklaces and older bracelet sizes: one
 * measurement and a component count (`maxItems`).
 */
export interface CategorySize {
  id: string;
  name: string;
  minMeasurementMm?: number;
  maxMeasurementMm?: number;
  defaultMeasurementMm?: number;
  selectedMeasurementMm?: number;
  measurement?: number;
  unit?: string;
  maxItems?: number;
}
export type ItemType = 'bead' | 'charm' | 'letter' | 'spacer';
export interface Product {
  categorySizes?: CategorySize[];
  imageUrl?: string | null;
  imageKey?: string | null;
  price?: number;
  categoryId?: string;
  id: string;
  name: string;
  type: JewelryType;
  description: string;
  basePrice: number;
  currency: 'EUR';
  image: string;
  available: boolean;
  sizes: string[];
  palette: string[];
  tag?: string;
}
export interface CustomizationItem {
  categoryId?: string;
  componentType?: string;
  imageUrl?: string | null;
  imageKey?: string | null;
  id: string;
  name: string;
  type: ItemType;
  color: string;
  hex: string;
  material: string;
  shape: string;
  price: number;
  currency: 'EUR';
  image: string;
  available: boolean;
  stock: number;
  /** Bracelet components: the length one piece occupies, in mm; null when not configured. */
  lengthMm?: number | null;
  symbol?: string;
}
export interface DesignItem {
  id: string;
  itemId: string;
  position: number;
  angle?: number;
}
export interface Design {
  selectedSize?: CategorySize | null;
  description?: string;
  id: string;
  userId: string;
  name: string;
  productId: string;
  size: string;
  items: DesignItem[];
  updatedAt: string;
}
export interface Address {
  id: string;
  userId: string;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}
export interface User {
  userName?: string;
  phone?: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: Address;
}
export type OrderStatus =
  'Pending' | 'Confirmed' | 'Being Made' | 'Ready' | 'Shipped' | 'Delivered';
export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}
export interface OrderDesign {
  design: Design;
  productName: string;
  basePrice: number;
  items: OrderItem[];
  total: number;
}
export interface Order {
  id: string;
  userId: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  designs: OrderDesign[];
  address: Address;
  email: string;
  delivery: number;
  total: number;
}
