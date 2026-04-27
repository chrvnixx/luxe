import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="container page">
      <div className="glass page-card reveal">
        <div className="auth-kicker">404</div>
        <h2 className="h2">Page not found</h2>
        <p className="muted">That route doesn’t exist. Head back to the catalog.</p>
        <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn btn-primary" to="/">
            Browse catalog
          </Link>
          <Link className="btn btn-ghost" to="/account">
            Account
          </Link>
        </div>
      </div>
    </main>
  );
}

