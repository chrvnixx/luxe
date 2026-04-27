import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { api, ApiError } from "../lib/api";
import { useAuth } from "../state/auth";
import { useToast } from "../state/toast";

export default function VerifyEmailPage() {
  const toast = useToast();
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [sp] = useSearchParams();

  const returnTo = useMemo(() => sp.get("returnTo") || "/account", [sp]);

  const [email, setEmail] = useState(sp.get("email") || "");
  const [code, setCode] = useState(sp.get("code") || "");
  const [busy, setBusy] = useState(false);

  const devHint = sp.get("code");

  return (
    <main className="container page auth">
      <div className="auth-card glass reveal">
        <div className="auth-head">
          <div className="auth-kicker">One last step</div>
          <h2 className="h2">Verify email</h2>
          <p className="muted">Enter the 6-digit code to unlock login + checkout.</p>
        </div>

        {devHint ? (
          <div className="dev-code">
            <span className="pill">Dev code</span>
            <span className="dev-code-value">{devHint}</span>
            <span className="muted">(only returned in non-production)</span>
          </div>
        ) : null}

        <form
          className="auth-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await api.verifyEmail({ email, code });
              await refresh();
              toast.push({ kind: "success", message: "Email verified" });
              nav(returnTo);
            } catch (error) {
              const msg = error instanceof ApiError ? error.message : "Could not verify email";
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
            <span className="label">Verification code</span>
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              placeholder="6 digits"
              required
            />
          </div>

          <button className="btn btn-primary" disabled={busy}>
            Verify
          </button>

          <div className="auth-foot">
            <span className="muted">Already verified?</span>{" "}
            <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="link">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}

