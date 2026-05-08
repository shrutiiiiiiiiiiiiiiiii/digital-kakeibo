"use client";

import { useEffect } from "react";
import { Button } from "@/components/design-system/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border border-black/10 bg-white/55 px-6 py-6 dark:border-white/10 dark:bg-sumi/25">
          <h1 className="font-display text-3xl tracking-[0.08em]">Something went quietly wrong.</h1>
          <p className="mt-3 font-sans text-sm leading-7 text-muted-foreground" role="status" aria-live="polite">
            Please try again. If the issue continues, refresh the page in a moment.
          </p>
          <div className="mt-6">
            <Button type="button" onClick={reset}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
