export default function GlobalLoading() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border border-black/10 bg-white/55 px-6 py-6 dark:border-white/10 dark:bg-sumi/25">
          <p className="font-sans text-sm text-muted-foreground" role="status" aria-live="polite">
            Loading quietly...
          </p>
        </div>
      </div>
    </main>
  );
}
