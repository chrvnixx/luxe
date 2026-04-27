import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { api, ApiError } from "../lib/api";
import { useToast } from "../state/toast";

export default function SignupPage() {
  const toast = useToast();
  const nav = useNavigate();
  const [sp] = useSearchParams();

  const returnTo = useMemo(() => sp.get("returnTo") || "/account", [sp]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <main className="container page auth">
      <div className="auth-card glass reveal">
        <div className="auth-head">
          <div className="auth-kicker">New account</div>
          <h2 className="h2">Create account</h2>
          <p className="muted">You’ll verify email once, then you’re in.</p>
        </div>

        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const data = await api.signup({ email, name, phone, password });
              toast.push({ kind: "success", message: data.message || "Account created" });

              const next = new URLSearchParams();
              next.set("email", email);
              if (data.verificationCode) next.set("code", data.verificationCode);
              next.set("returnTo", returnTo);

              nav(`/verify-email?${next.toString()}`);
            } catch (error) {
              const msg = error instanceof ApiError ? error.message : "Could not create account";
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
            <span className="label">Full name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
          <div className="field">
            <span className="label">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              required
            />
          </div>
          <div className="field">
            <span className="label">Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </div>

          <button className="btn btn-primary" disabled={busy}>
            Create account
          </button>

          <div className="auth-foot">
            <span className="muted">Already have an account?</span>{" "}
            <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="link">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

