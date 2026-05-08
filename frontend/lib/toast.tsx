"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastTone = "neutral" | "success" | "danger";

export type Toast = {
  id: string;
  message: string;
  tone?: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = {
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function toneClasses(tone?: ToastTone) {
  if (tone === "success") return "border-enji/30 bg-washi text-sumi";
  if (tone === "danger") return "border-enji/60 bg-washi text-sumi";
  return "border-black/10 bg-washi text-sumi";
}

function ToastSurface({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={[
        "rounded-xl border px-6 py-5 text-sm leading-6 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.45)]",
        toneClasses(toast.tone),
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="font-sans text-sm leading-6">{toast.message}</p>
        <div className="flex shrink-0 items-center gap-2">
          {toast.actionLabel && toast.onAction ? (
            <button
              type="button"
              className="rounded-md border border-black/15 bg-white/70 px-3 py-1 text-xs font-semibold text-sumi hover:bg-white dark:border-white/15 dark:bg-sumi/40 dark:text-washi dark:hover:bg-sumi/55"
              onClick={() => {
                toast.onAction?.();
                onDismiss(toast.id);
              }}
            >
              {toast.actionLabel}
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md border border-black/10 px-3 py-1 text-xs font-medium text-sumi hover:bg-black/[0.03]"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function ToastViewport({ toasts }: { toasts: Toast[] }) {
  const { dismissToast } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-6 pb-10">
      <div className="pointer-events-auto flex w-full max-w-md flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <ToastSurface key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<Toast, "id">) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((prev) => [...prev, { id, ...toast }]);
  }, []);

  const value = useMemo(
    () => ({ pushToast, dismissToast }),
    [dismissToast, pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
