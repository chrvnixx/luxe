import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "info" | "success" | "error";

type Toast = {
  id: string;
  kind: ToastKind;
  title?: string;
  message: string;
};

type ToastInput = Omit<Toast, "id"> & { id?: string };

type ToastContextValue = {
  push: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const value = useMemo<ToastContextValue>(() => {
    return {
      push: (toast) => {
        const id = toast.id ?? makeId();
        const next: Toast = { id, kind: toast.kind, title: toast.title, message: toast.message };

        setToasts((prev) => [next, ...prev].slice(0, 4));

        const existing = timers.current.get(id);
        if (existing) window.clearTimeout(existing);

        const t = window.setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== id));
          timers.current.delete(id);
        }, toast.kind === "error" ? 6000 : 4200);

        timers.current.set(id, t);
      },
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <div className="toast-top">
              <div className="toast-title">{t.title ?? (t.kind === "error" ? "Oops" : "Luxe")}</div>
              <button
                className="toast-x"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            <div className="toast-msg">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

