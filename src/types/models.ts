export type JewelryType = 'bracelet' | 'necklace';
export type ItemType = 'bead' | 'charm' | 'letter' | 'spacer';
export interface Product {
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
  symbol?: string;
}
export interface DesignItem {
  id: string;
  itemId: string;
  position: number;
}
export interface Design {
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
export interface RegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  password: string;
  confirmPassword: string;
}
