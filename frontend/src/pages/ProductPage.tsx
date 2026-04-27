import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { api, ApiError } from "../lib/api";
import { formatMoney } from "../lib/money";
import type { Product } from "../lib/types";
import { useAuth } from "../state/auth";
import { useCart } from "../state/cart";
import { useToast } from "../state/toast";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ProductPage() {
  const { id } = useParams();
  const toast = useToast();
  const nav = useNavigate();
  const { status: authStatus } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!id) return;
    let ignore = false;
    setLoading(true);
    api
      .getProduct(id)
      .then((data) => {
        if (!ignore) setProduct(data.product);
      })
      .catch((error) => {
        if (ignore) return;
        const msg = error instanceof ApiError ? error.message : "Failed to load product";
        toast.push({ kind: "error", message: msg });
        setProduct(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id, toast]);

  const img = useMemo(() => {
    if (!product) return "";
    return product.images?.[0] || "";
  }, [product]);

  if (loading) {
    return (
      <main className="container page">
        <div className="glass page-card reveal">
          <div className="skeleton-line" style={{ width: "45%" }} />
          <div className="skeleton-line" style={{ width: "70%" }} />
          <div className="skeleton-block" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container page">
        <div className="glass page-card reveal">
          <h2 className="h2">Product not found</h2>
          <p className="muted">Try going back to the catalog.</p>
          <div style={{ marginTop: 16 }}>
            <Link className="btn" to="/">
              Back to catalog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const maxQty = Math.max(1, Math.min(99, product.countInStock || 1));
  const inStock = product.countInStock > 0;

  return (
    <main className="container page">
      <div className="crumbs reveal">
        <Link className="crumb" to="/">
          Catalog
        </Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{product.name}</span>
      </div>

      <section className="product reveal" style={{ ["--d" as any]: "80ms" }}>
        <div className="product-left glass">
          {img && !broken ? (
            <img
              className="product-img"
              src={img}
              alt={product.name}
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="product-img-fallback">
              <div className="product-img-fallback-mark">Luxe</div>
            </div>
          )}
        </div>

        <div className="product-right glass">
          <div className="product-title">
            <div className="h2">{product.name}</div>
            <div className="price big">{formatMoney(product.price, product.currency)}</div>
          </div>

          <p className="muted product-desc">{product.description || "No description yet."}</p>

          <div className="product-row">
            {inStock ? <span className="pill good">In stock</span> : <span className="pill bad">Sold out</span>}
            {product.brand ? <span className="pill">Brand: {product.brand}</span> : null}
          </div>

          <hr className="sep" />

          <div className="qty">
            <button
              className="btn btn-ghost"
              onClick={() => setQty((q) => clamp(q - 1, 1, maxQty))}
              disabled={!inStock || qty <= 1}
            >
              −
            </button>
            <input
              className="qty-input"
              inputMode="numeric"
              value={String(qty)}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/[^\d]/g, ""));
                setQty(clamp(Number.isFinite(n) ? n : 1, 1, maxQty));
              }}
              disabled={!inStock}
              aria-label="Quantity"
            />
            <button
              className="btn btn-ghost"
              onClick={() => setQty((q) => clamp(q + 1, 1, maxQty))}
              disabled={!inStock || qty >= maxQty}
            >
              +
            </button>
          </div>

          <div className="product-cta">
            <button
              className="btn btn-primary"
              disabled={!inStock}
              onClick={async () => {
                if (authStatus !== "authenticated") {
                  toast.push({ kind: "info", message: "Sign in to start a cart." });
                  nav(`/login?returnTo=${encodeURIComponent(`/product/${product._id}`)}`);
                  return;
                }
                try {
                  await addItem(product._id, qty);
                  toast.push({ kind: "success", message: "Added to cart" });
                  nav("/cart");
                } catch (error) {
                  const msg = error instanceof ApiError ? error.message : "Could not add to cart";
                  toast.push({ kind: "error", message: msg });
                }
              }}
            >
              Add to cart
            </button>
            <Link className="btn btn-ghost" to="/cart">
              View cart
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

