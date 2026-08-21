export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
    </div>
  );
}
