import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "../lib/api";
import { useAuth } from "../state/auth";
import { useToast } from "../state/toast";

export default function LoginPage() {
  const toast = useToast();
  const nav = useNavigate();
  const { login } = useAuth();
  const [sp] = useSearchParams();

  const returnTo = useMemo(() => sp.get("returnTo") || "/account", [sp]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main className="container page auth">
      <div className="auth-card glass reveal">
        <div className="auth-head">
          <div className="auth-kicker">Welcome back</div>
          <h2 className="h2">Sign in</h2>
          <p className="muted">Your cart and orders live in your account session.</p>
        </div>

        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await login(email, password);
              toast.push({ kind: "success", message: "Signed in" });
              nav(returnTo);
            } catch (error) {
              const msg = error instanceof ApiError ? error.message : "Could not sign in";
              toast.push({ kind: "error", message: msg });
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="field">
            <span className="label">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <span className="label">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn btn-primary" disabled={busy}>
            Sign in
          </button>

          <div className="auth-foot">
            <span className="muted">New here?</span>{" "}
            <Link to="/signup" className="link">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

