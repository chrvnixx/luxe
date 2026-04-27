import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../state/auth";
import { useCart } from "../state/cart";
import { useToast } from "../state/toast";

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search]);
  return null;
}

export default function Shell() {
  const nav = useNavigate();
  const toast = useToast();
  const { status, user, logout } = useAuth();
  const { itemsCount } = useCart();

  return (
    <div className="shell">
      <ScrollToTop />

      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">LUXE</span>
            <span className="brand-sub">storefront</span>
          </Link>

          <nav className="nav">
            <Link to="/cart" className="nav-link">
              Cart
              {itemsCount > 0 ? <span className="count">{itemsCount}</span> : null}
            </Link>

            {status === "authenticated" && user ? (
              <>
                <Link to="/account" className="nav-link">
                  Account
                </Link>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    await logout();
                    toast.push({ kind: "success", message: "Signed out" });
                    nav("/");
                  }}
                >
                  Sign out
                </button>
              </>
            ) : status === "loading" ? (
              <span className="nav-muted">Checking session…</span>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="topbar-shadow" />

      <Outlet />

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-title">Luxe</div>
          <div className="footer-meta">
            Built with Vite + React, backed by your `/api/*` store service.
          </div>
        </div>
      </footer>
    </div>
  );
}
