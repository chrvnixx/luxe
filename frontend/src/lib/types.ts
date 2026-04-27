export type ApiMessage = { message?: string };

export type UserRole = "customer" | "admin";

export type User = {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
};

export type ProductCategory =
  | { _id: string; name: string; slug: string }
  | string
  | null
  | undefined;

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category?: ProductCategory;
  brand?: string;
  countInStock: number;
  isActive?: boolean;
};

export type CartItem = {
  _id: string;
  product: string;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  quantity: number;
};

export type Cart = {
  _id: string;
  user: string;
  items: CartItem[];
  itemsPrice: number;
};

export type OrderItem = {
  _id: string;
  product: string;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  currency: string;
  quantity: number;
};

export type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
};

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "refunded";

export type Order = {
  _id: string;
  user: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  paidAt?: string;
  deliveredAt?: string;
  createdAt?: string;
};

