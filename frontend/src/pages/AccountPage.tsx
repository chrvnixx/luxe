import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api, ApiError } from "../lib/api";
import { formatMoney } from "../lib/money";
import type { Order } from "../lib/types";
import { useAuth } from "../state/auth";
import { useToast } from "../state/toast";

export default function AccountPage() {
  const toast = useToast();
  const { status, user, refresh } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user?.name, user?.phone]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let ignore = false;
    setLoadingOrders(true);
    api
      .myOrders()
      .then((data) => {
        if (!ignore) setOrders(data.orders);
      })
      .catch(() => {
        if (!ignore) setOrders([]);
      })
      .finally(() => {
        if (!ignore) setLoadingOrders(false);
      });
    return () => {
      ignore = true;
    };
  }, [status]);

  const currency = useMemo(() => orders[0]?.orderItems?.[0]?.currency || "USD", [orders]);

  if (status === "loading") {
    return (
      <main className="container page">
        <div className="glass page-card reveal">Checking session…</div>
      </main>
    );
  }

  if (status !== "authenticated" || !user) {
    return (
      <main className="container page">
        <div className="glass page-card reveal">
          <h2 className="h2">Account</h2>
          <p className="muted">Sign in to see orders and manage your profile.</p>
          <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" to="/login?returnTo=/account">
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
          <h2 className="h2">Account</h2>
          <p className="muted">Profile + order history.</p>
        </div>
      </div>

      <div className="account-grid">
        <section className="glass account-panel reveal" style={{ ["--d" as any]: "80ms" }}>
          <div className="panel-title">Profile</div>
          <div className="profile-meta">
            <div className="pill">Email: {user.email}</div>
            <div className="pill">Role: {user.role}</div>
            <div className={`pill ${user.isVerified ? "good" : "bad"}`}>
              {user.isVerified ? "Email verified" : "Verify your email"}
            </div>
          </div>

          <hr className="sep" />

          <div className="ship-grid">
            <div className="field">
              <span className="label">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <span className="label">Phone</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await api.updateMe({ name, phone });
                  await refresh();
                  toast.push({ kind: "success", message: "Profile updated" });
                } catch (error) {
                  const msg = error instanceof ApiError ? error.message : "Could not update profile";
                  toast.push({ kind: "error", message: msg });
                } finally {
                  setSaving(false);
                }
              }}
            >
              Save profile
            </button>
            {!user.isVerified ? (
              <Link className="btn btn-ghost" to={`/verify-email?email=${encodeURIComponent(user.email)}`}>
                Verify email
              </Link>
            ) : null}
          </div>
        </section>

        <section className="glass account-panel reveal" style={{ ["--d" as any]: "140ms" }}>
          <div className="panel-title">Orders</div>
          {loadingOrders ? (
            <div>
              <div className="skeleton-line" style={{ width: "65%" }} />
              <div className="skeleton-line" style={{ width: "48%" }} />
              <div className="skeleton-line" style={{ width: "72%" }} />
            </div>
          ) : orders.length === 0 ? (
            <div className="empty">
              <div className="empty-title">No orders yet.</div>
              <div className="muted">Add something to cart and checkout.</div>
              <div className="empty-actions">
                <Link className="btn btn-primary" to="/">
                  Browse catalog
                </Link>
              </div>
            </div>
          ) : (
            <div className="orders">
              {orders.map((o) => (
                <Link key={o._id} to={`/order/${o._id}`} className="order-card">
                  <div className="order-card-top">
                    <div className="order-card-id">#{o._id.slice(-6).toUpperCase()}</div>
                    <span className={`pill ${o.paymentStatus === "paid" ? "good" : "bad"}`}>
                      {o.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    </span>
                  </div>
                  <div className="order-card-sub muted">
                    {o.orderItems.length} item{o.orderItems.length === 1 ? "" : "s"} · {o.status}
                  </div>
                  <div className="order-card-total">{formatMoney(o.totalPrice, currency)}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

