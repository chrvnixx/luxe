import type {
  ApiMessage,
  Cart,
  Category,
  Order,
  Product,
  ShippingAddress,
  User,
} from "./types";

const API_BASE = String(import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function parseJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const payload = await parseJsonSafe(res);
    const message =
      (payload as ApiMessage | null)?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ ok: boolean }>(`/api/health`),

  getCategories: () => request<{ categories: Category[] }>(`/api/categories`),

  getProducts: (params?: {
    q?: string;
    category?: string;
    sort?: "newest" | "price_asc" | "price_desc";
    page?: number;
    limit?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.category) sp.set("category", params.category);
    if (params?.sort) sp.set("sort", params.sort);
    if (params?.page) sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    const qs = sp.toString();
    return request<{
      products: Product[];
      page: number;
      pages: number;
      total: number;
    }>(`/api/products${qs ? `?${qs}` : ""}`);
  },

  getProduct: (id: string) =>
    request<{ product: Product }>(`/api/products/${encodeURIComponent(id)}`),

  signup: (payload: { email: string; name: string; password: string; phone: string }) =>
    request<{
      message: string;
      user: User;
      verificationCode?: string;
    }>(`/api/auth/signup`, { method: "POST", body: JSON.stringify(payload) }),

  verifyEmail: (payload: { email: string; code: string }) =>
    request<{ message: string; user: User }>(`/api/auth/verify-email`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ message: string; user: User }>(`/api/auth/login`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () => request<{ message: string }>(`/api/auth/logout`, { method: "POST" }),

  me: () => request<{ user: User }>(`/api/auth/me`),

  updateMe: (payload: { name?: string; phone?: string }) =>
    request<{ user: User }>(`/api/users/me`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getCart: () => request<{ cart: Cart }>(`/api/cart`),

  addCartItem: (payload: { productId: string; variantId?: string; quantity?: number }) =>
    request<{ cart: Cart }>(`/api/cart/items`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateCartItem: (itemId: string, payload: { quantity: number }) =>
    request<{ cart: Cart }>(`/api/cart/items/${encodeURIComponent(itemId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  removeCartItem: (itemId: string) =>
    request<{ cart: Cart }>(`/api/cart/items/${encodeURIComponent(itemId)}`, {
      method: "DELETE",
    }),

  clearCart: () => request<{ cart: Cart }>(`/api/cart`, { method: "DELETE" }),

  createOrder: (payload: { shippingAddress: ShippingAddress; paymentMethod?: string }) =>
    request<{ order: Order }>(`/api/orders`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  myOrders: () => request<{ orders: Order[] }>(`/api/orders/my`),

  getOrder: (id: string) =>
    request<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`),

  payOrder: (id: string) =>
    request<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}/pay`, {
      method: "PATCH",
    }),

  deliverOrder: (id: string) =>
    request<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}/deliver`, {
      method: "PATCH",
    }),
};
