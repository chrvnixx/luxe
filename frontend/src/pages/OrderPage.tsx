import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, ApiError } from "../lib/api";
import { formatMoney } from "../lib/money";
import type { Order } from "../lib/types";
import { useAuth } from "../state/auth";
import { useToast } from "../state/toast";

function fmtDate(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function OrderPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { status: authStatus, user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    setLoading(true);
    api
      .getOrder(id)
      .then((data) => {
        if (!ignore) setOrder(data.order);
      })
      .catch((error) => {
        if (ignore) return;
        const msg = error instanceof ApiError ? error.message : "Failed to load order";
        toast.push({ kind: "error", message: msg });
        setOrder(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, toast]);

  const currency = useMemo(() => {
    const first = order?.orderItems?.[0];
    return first?.currency || "USD";
  }, [order]);

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
          <h2 className="h2">Sign in to view orders</h2>
          <p className="muted">Orders are tied to your account session.</p>
          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" to={`/login?returnTo=${encodeURIComponent(`/order/${id || ""}`)}`}>
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

  if (loading) {
    return (
      <main className="container page">
        <div className="glass page-card reveal">
          <div className="skeleton-line" style={{ width: "35%" }} />
          <div className="skeleton-line" style={{ width: "60%" }} />
          <div className="skeleton-block" />
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="container page">
        <div className="glass page-card reveal">
          <h2 className="h2">Order not found</h2>
          <p className="muted">It may have been deleted, or you don’t have access.</p>
          <div style={{ marginTop: 16 }}>
            <Link className="btn" to="/account">
              Go to account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container page">
      <div className="crumbs reveal">
        <Link className="crumb" to="/account">
          Account
        </Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Order</span>
      </div>

      <div className="page-head reveal" style={{ ["--d" as any]: "80ms" }}>
        <div>
          <h2 className="h2">Order #{order._id.slice(-6).toUpperCase()}</h2>
          <p className="muted">Created {fmtDate(order.createdAt)}</p>
        </div>

        <div className="order-badges">
          <span className={`pill ${order.paymentStatus === "paid" ? "good" : "bad"}`}>
            {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
          </span>
          <span className="pill">Status: {order.status}</span>
        </div>
      </div>

      <div className="order-grid">
        <section className="glass order-panel reveal" style={{ ["--d" as any]: "140ms" }}>
          <div className="panel-title">Items</div>
          <div className="order-items">
            {order.orderItems.map((i) => (
              <div key={i._id} className="order-item">
                <div className="order-img">
                  {i.image ? <img src={i.image} alt={i.name} /> : <div className="img-fallback">LX</div>}
                </div>
                <div className="order-main">
                  <div className="order-name">{i.name}</div>
                  <div className="order-sub">
                    <span className="muted">Qty {i.quantity}</span>
                    <span className="muted">·</span>
                    <span className="price">{formatMoney(i.price, i.currency)}</span>
                  </div>
                </div>
                <div className="order-line">
                  {formatMoney(i.price * i.quantity, i.currency)}
                </div>
              </div>
            ))}
          </div>

          <hr className="sep" />
          <div className="summary-row">
            <span className="muted">Total</span>
            <span className="price">{formatMoney(order.totalPrice, currency)}</span>
          </div>
        </section>

        <aside className="glass order-panel reveal" style={{ ["--d" as any]: "200ms" }}>
          <div className="panel-title">Shipping</div>
          <div className="ship-card">
            <div className="ship-name">{order.shippingAddress.fullName}</div>
            <div className="muted">{order.shippingAddress.phone}</div>
            <div className="ship-lines">
              <div>{order.shippingAddress.line1}</div>
              {order.shippingAddress.line2 ? <div>{order.shippingAddress.line2}</div> : null}
              <div>
                {order.shippingAddress.city}
                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}
                {order.shippingAddress.postalCode ? ` ${order.shippingAddress.postalCode}` : ""}
              </div>
              <div>{order.shippingAddress.country}</div>
            </div>
          </div>

          <hr className="sep" />

          <div className="panel-title">Actions</div>
          {order.paymentStatus !== "paid" ? (
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const data = await api.payOrder(order._id);
                  setOrder(data.order);
                  toast.push({ kind: "success", message: "Marked as paid (demo)" });
                } catch (error) {
                  const msg = error instanceof ApiError ? error.message : "Could not mark paid";
                  toast.push({ kind: "error", message: msg });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Mark paid (demo)
            </button>
          ) : (
            <div className="pill good">Paid at {fmtDate(order.paidAt)}</div>
          )}

          {user?.role === "admin" && order.status !== "delivered" ? (
            <button
              className="btn btn-ghost"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const data = await api.deliverOrder(order._id);
                  setOrder(data.order);
                  toast.push({ kind: "success", message: "Marked delivered" });
                } catch (error) {
                  const msg = error instanceof ApiError ? error.message : "Could not deliver";
                  toast.push({ kind: "error", message: msg });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Mark delivered
            </button>
          ) : null}

          <button className="btn btn-ghost" onClick={() => nav("/account")}>
            Back to account
          </button>
        </aside>
      </div>
    </main>
  );
}

