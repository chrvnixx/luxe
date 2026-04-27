import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { api, ApiError } from "../lib/api";
import { formatMoney } from "../lib/money";
import type { Category, Product } from "../lib/types";
import { useDebouncedValue } from "../lib/useDebouncedValue";
import { useAuth } from "../state/auth";
import { useCart } from "../state/cart";
import { useToast } from "../state/toast";

type SortKey = "newest" | "price_asc" | "price_desc";

function ProductImage({ product }: { product: Product }) {
  const [broken, setBroken] = useState(false);
  const src = product.images?.[0] || "";

  if (!src || broken) {
    const initials = product.name
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
    return <div className="img-fallback">{initials}</div>;
  }

  return (
    <img
      src={src}
      alt={product.name}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

export default function HomePage() {
  const toast = useToast();
  const nav = useNavigate();
  const { status: authStatus } = useAuth();
  const { addItem } = useCart();

  const [sp, setSp] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const q = sp.get("q") || "";
  const category = sp.get("category") || "";
  const sort = (sp.get("sort") as SortKey | null) || "newest";

  const debouncedQ = useDebouncedValue(q, 220);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === category) || null,
    [categories, category],
  );

  useEffect(() => {
    let ignore = false;
    api
      .getCategories()
      .then((data) => {
        if (!ignore) setCategories(data.categories);
      })
      .catch(() => {
        // categories are nice-to-have; keep silent
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api
      .getProducts({ q: debouncedQ || undefined, category: category || undefined, sort })
      .then((data) => {
        if (!ignore) setProducts(data.products);
      })
      .catch((error) => {
        if (ignore) return;
        const msg = error instanceof ApiError ? error.message : "Failed to load products";
        toast.push({ kind: "error", message: msg });
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [debouncedQ, category, sort, toast]);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp);
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setSp(next, { replace: true });
  }

  return (
    <main className="home">
      <section className="hero">
        <div className="container hero-inner reveal">
          <div className="hero-copy">
            <div className="pill">
              <span className="dot" />
              New season drop
            </div>
            <h1 className="h1">
              Luxury basics, cut sharp.
              <span className="h1-em"> Delivered fast.</span>
            </h1>
            <p className="lead">
              Browse the catalog, build a cart, and place an order on your own backend.
            </p>

            <div className="hero-cta">
              <a className="btn btn-primary" href="#catalog">
                Explore catalog
              </a>
              <Link className="btn btn-ghost" to="/cart">
                Go to cart
              </Link>
            </div>
          </div>

          <div className="hero-art glass">
            <div className="hero-art-top">
              <div className="hero-art-title">Luxe</div>
              <div className="hero-art-sub">Storefront preview</div>
            </div>
            <div className="hero-art-grid">
              <div className="hero-tile a" />
              <div className="hero-tile b" />
              <div className="hero-tile c" />
              <div className="hero-tile d" />
              <div className="hero-tile e" />
              <div className="hero-tile f" />
            </div>
          </div>
        </div>
      </section>

      <section id="catalog" className="container catalog">
        <div className="catalog-top reveal" style={{ ["--d" as any]: "80ms" }}>
          <div>
            <h2 className="h2">Catalog</h2>
            <p className="muted">
              {activeCategory ? (
                <>
                  Filtering by <span className="ink">{activeCategory.name}</span>.
                </>
              ) : (
                "Pick a category, search, then add to cart."
              )}
            </p>
          </div>

          <div className="filters">
            <div className="field">
              <span className="label">Search</span>
              <input
                value={q}
                placeholder="Try “runner”, “leather”, “linen”…"
                onChange={(e) => setParam("q", e.target.value)}
              />
            </div>
            <div className="field">
              <span className="label">Sort</span>
              <select value={sort} onChange={(e) => setParam("sort", e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
              </select>
            </div>
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="chips reveal" style={{ ["--d" as any]: "140ms" }}>
            <button
              className={`chip ${!category ? "active" : ""}`}
              onClick={() => setParam("category", "")}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                className={`chip ${category === c.slug ? "active" : ""}`}
                onClick={() => setParam("category", c.slug)}
              >
                {c.name}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card product-card skeleton" />
            ))
          ) : products.length === 0 ? (
            <div className="empty glass reveal">
              <div className="empty-title">Nothing matched that.</div>
              <div className="muted">
                Try a different search, or clear filters to see the full catalog.
              </div>
              <div className="empty-actions">
                <button className="btn" onClick={() => setSp(new URLSearchParams(), { replace: true })}>
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            products.map((p, idx) => (
              <article
                key={p._id}
                className="card product-card reveal"
                style={{ ["--d" as any]: `${Math.min(idx * 35, 280)}ms` }}
              >
                <Link to={`/product/${p._id}`} className="product-link">
                  <div className="product-media">
                    <ProductImage product={p} />
                  </div>
                  <div className="product-meta">
                    <div className="product-name">{p.name}</div>
                    <div className="product-sub">
                      <span className="price">{formatMoney(p.price, p.currency)}</span>
                      {p.countInStock > 0 ? (
                        <span className="pill good">In stock</span>
                      ) : (
                        <span className="pill bad">Sold out</span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="product-actions">
                  <button
                    className="btn btn-primary"
                    disabled={p.countInStock <= 0}
                    onClick={async () => {
                      if (authStatus !== "authenticated") {
                        toast.push({ kind: "info", message: "Sign in to start a cart." });
                        nav(`/login?returnTo=${encodeURIComponent(`/product/${p._id}`)}`);
                        return;
                      }
                      try {
                        await addItem(p._id, 1);
                        toast.push({ kind: "success", message: "Added to cart" });
                      } catch (error) {
                        const msg =
                          error instanceof ApiError ? error.message : "Could not add to cart";
                        toast.push({ kind: "error", message: msg });
                      }
                    }}
                  >
                    Add to cart
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

