import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "../lib/api";
import type { Cart, Order, ShippingAddress } from "../lib/types";
import { useAuth } from "./auth";

type CartStatus = "idle" | "loading";

type CartContextValue = {
  status: CartStatus;
  cart: Cart | null;
  itemsCount: number;
  refresh: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
  checkout: (payload: { shippingAddress: ShippingAddress; paymentMethod?: string }) => Promise<Order>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<CartStatus>("idle");
  const [cart, setCart] = useState<Cart | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await api.getCart();
      setCart(data.cart);
    } finally {
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      refresh().catch(() => setCart(null));
    } else if (authStatus !== "loading") {
      setCart(null);
    }
  }, [authStatus, refresh]);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    const data = await api.addCartItem({ productId, quantity });
    setCart(data.cart);
  }, []);

  const updateItem = useCallback(async (itemId: string, quantity: number) => {
    const data = await api.updateCartItem(itemId, { quantity });
    setCart(data.cart);
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    const data = await api.removeCartItem(itemId);
    setCart(data.cart);
  }, []);

  const clear = useCallback(async () => {
    const data = await api.clearCart();
    setCart(data.cart);
  }, []);

  const checkout = useCallback(
    async (payload: { shippingAddress: ShippingAddress; paymentMethod?: string }) => {
      const data = await api.createOrder(payload);
      setCart(null);
      return data.order;
    },
    [],
  );

  const itemsCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  const value = useMemo<CartContextValue>(
    () => ({
      status,
      cart,
      itemsCount,
      refresh,
      addItem,
      updateItem,
      removeItem,
      clear,
      checkout,
    }),
    [status, cart, itemsCount, refresh, addItem, updateItem, removeItem, clear, checkout],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

