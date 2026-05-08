"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Button } from "@/components/design-system/Button";

export function Modal({
  isOpen,
  title,
  description,
  children,
  onClose,
  primaryAction,
  secondaryAction,
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  onClose: () => void;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (!isOpen) return;
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-6 sm:items-center"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dk-modal-title"
            aria-describedby={description ? "dk-modal-description" : undefined}
            className={[
              "relative w-full max-w-lg rounded-[28px] border border-black/15 bg-washi p-8 shadow-[0_24px_80px_-34px_rgba(0,0,0,0.55)]",
              "dark:border-white/10 dark:bg-sumi dark:text-washi dark:shadow-[0_28px_90px_-40px_rgba(0,0,0,0.85)]",
            ].join(" ")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="space-y-3">
              <h2 id="dk-modal-title" className="font-display text-[22px] tracking-[0.04em] text-sumi dark:text-washi">
                {title}
              </h2>
              {description ? (
                <p id="dk-modal-description" className="font-sans text-sm leading-7 text-black/65 dark:text-washi/70">
                  {description}
                </p>
              ) : null}
            </div>

            {children ? <div className="mt-6">{children}</div> : null}

            <div className="mt-8 flex flex-col gap-3">
              {primaryAction ? <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button> : null}
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="min-h-[44px] w-full rounded-xl border border-black/15 bg-transparent px-4 font-display text-[13px] tracking-[0.1em] text-sumi transition hover:bg-black/5 dark:border-white/20 dark:text-washi dark:hover:bg-white/5"
                >
                  {secondaryAction.label}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] w-full rounded-xl border border-transparent px-2 text-center font-display text-[13px] tracking-[0.1em] text-black/60 underline decoration-black/20 underline-offset-8 transition hover:text-sumi hover:decoration-sumi dark:text-washi/70 dark:decoration-washi/25 dark:hover:text-washi"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
