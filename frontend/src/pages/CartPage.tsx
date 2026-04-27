import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ApiError, api } from "../lib/api";
import { formatMoney } from "../lib/money";
import type { CartItem, ShippingAddress } from "../lib/types";
import { useAuth } from "../state/auth";
import { useCart } from "../state/cart";
import { useToast } from "../state/toast";

function ItemRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: CartItem;
  onUpdate: (itemId: string, nextQty: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div className="cart-item">
      <div className="cart-img">
        {item.image ? <img src={item.image} alt={item.name} /> : <div className="img-fallback">LX</div>}
      </div>

      <div className="cart-main">
        <div className="cart-name">{item.name}</div>
        <div className="cart-sub">
          <span className="price">{formatMoney(item.price, item.currency)}</span>
          <span className="muted">·</span>
          <span className="muted">Qty {item.quantity}</span>
        </div>
      </div>

      <div className="cart-actions">
        <button
          className="btn btn-ghost btn-sm"
          disabled={busy || item.quantity <= 1}
          onClick={async () => {
            setBusy(true);
            try {
              await onUpdate(item._id, Math.max(1, item.quantity - 1));
            } finally {
              setBusy(false);
            }
          }}
        >
          −
        </button>
        <button
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onUpdate(item._id, item.quantity + 1);
            } finally {
              setBusy(false);
            }
          }}
        >
          +
        </button>
        <button
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onRemove(item._id);
            } finally {
              setBusy(false);
            }
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const toast = useToast();
  const nav = useNavigate();
  const { status: authStatus, user } = useAuth();
  const { cart, status, updateItem, removeItem, clear, checkout } = useCart();

  const [placing, setPlacing] = useState(false);
  const [ship, setShip] = useState<ShippingAddress>({
    fullName: user?.name || "",
    phone: user?.phone || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "NG",
  });

  const subtotal = cart?.itemsPrice ?? 0;
  const currency = cart?.items?.[0]?.currency || "USD";

  const canCheckout = useMemo(() => {
    if (!cart || cart.items.length === 0) return false;
    return Boolean(ship.fullName && ship.phone && ship.line1 && ship.city && ship.country);
  }, [cart, ship]);

  if (authStatus === "loading") {
    return (
      <main className="container page">
        <div className="glass page-card reveal">Checking session…</div>
      </main>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <main className="container page">
        <div className="glass page-card reveal">
          <h2 className="h2">Your cart is waiting</h2>
          <p className="muted">Sign in to manage your cart and place orders.</p>
          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" to="/login?returnTo=/cart">
              Sign in
            </Link>
            <Link className="btn btn-ghost" to="/">
              Browse catalog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container page">
      <div className="page-head reveal">
        <div>
          <h2 className="h2">Cart</h2>
          <p className="muted">Adjust quantities, then checkout when you’re ready.</p>
        </div>
        {cart?.items?.length ? (
          <button
            className="btn btn-ghost"
            disabled={status === "loading"}
            onClick={async () => {
              try {
                await clear();
                toast.push({ kind: "success", message: "Cart cleared" });
              } catch (error) {
                const msg = error instanceof ApiError ? error.message : "Could not clear cart";
                toast.push({ kind: "error", message: msg });
              }
            }}
          >
            Clear cart
          </button>
        ) : null}
      </div>

      <div className="cart-grid">
        <section className="glass cart-panel reveal" style={{ ["--d" as any]: "80ms" }}>
          {cart?.items?.length ? (
            <div className="cart-items">
              {cart.items.map((item) => (
                <ItemRow
                  key={item._id}
                  item={item}
                  onUpdate={async (itemId, nextQty) => {
                    try {
                      await updateItem(itemId, nextQty);
                    } catch (error) {
                      const msg = error instanceof ApiError ? error.message : "Could not update item";
                      toast.push({ kind: "error", message: msg });
                    }
                  }}
                  onRemove={async (itemId) => {
                    try {
                      await removeItem(itemId);
                      toast.push({ kind: "success", message: "Removed" });
                    } catch (error) {
                      const msg = error instanceof ApiError ? error.message : "Could not remove item";
                      toast.push({ kind: "error", message: msg });
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="empty-title">Cart is empty.</div>
              <div className="muted">Go pick something sharp.</div>
              <div className="empty-actions">
                <Link className="btn btn-primary" to="/">
                  Browse catalog
                </Link>
              </div>
            </div>
          )}
        </section>

        <aside className="glass cart-panel reveal" style={{ ["--d" as any]: "140ms" }}>
          <div className="summary">
            <div className="summary-title">Checkout</div>

            <div className="summary-row">
              <span className="muted">Subtotal</span>
              <span className="price">{formatMoney(subtotal, currency)}</span>
            </div>
            <div className="summary-row">
              <span className="muted">Shipping</span>
              <span className="muted">Calculated at payment</span>
            </div>
            <div className="summary-row">
              <span className="muted">Tax</span>
              <span className="muted">Calculated at payment</span>
            </div>
            <hr className="sep" />

            <div className="ship-grid">
              <div className="field">
                <span className="label">Full name</span>
                <input
                  value={ship.fullName}
                  onChange={(e) => setShip((s) => ({ ...s, fullName: e.target.value }))}
                />
              </div>
              <div className="field">
                <span className="label">Phone</span>
                <input value={ship.phone} onChange={(e) => setShip((s) => ({ ...s, phone: e.target.value }))} />
              </div>
              <div className="field ship-wide">
                <span className="label">Address</span>
                <input value={ship.line1} onChange={(e) => setShip((s) => ({ ...s, line1: e.target.value }))} placeholder="Street, number, etc." />
              </div>
              <div className="field ship-wide">
                <span className="label">Address line 2</span>
                <input value={ship.line2 || ""} onChange={(e) => setShip((s) => ({ ...s, line2: e.target.value }))} placeholder="Apartment, landmark (optional)" />
              </div>
              <div className="field">
                <span className="label">City</span>
                <input value={ship.city} onChange={(e) => setShip((s) => ({ ...s, city: e.target.value }))} />
              </div>
              <div className="field">
                <span className="label">Country</span>
                <input value={ship.country} onChange={(e) => setShip((s) => ({ ...s, country: e.target.value }))} />
              </div>
            </div>

            <button
              className="btn btn-primary"
              disabled={!canCheckout || placing}
              onClick={async () => {
                if (!canCheckout) return;
                setPlacing(true);
                try {
                  const order = await checkout({ shippingAddress: ship, paymentMethod: "card" });
                  toast.push({ kind: "success", message: "Order created" });
                  nav(`/order/${order._id}`);
                } catch (error) {
                  const msg = error instanceof ApiError ? error.message : "Could not place order";
                  toast.push({ kind: "error", message: msg });
                } finally {
                  setPlacing(false);
                }
              }}
            >
              Place order
            </button>

            <button
              className="btn btn-ghost"
              disabled={!cart?.items?.length}
              onClick={async () => {
                try {
                  await api.myOrders();
                  nav("/account");
                } catch {
                  nav("/account");
                }
              }}
            >
              View account
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

