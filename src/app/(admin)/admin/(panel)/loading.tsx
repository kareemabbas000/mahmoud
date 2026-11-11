/** Shown instantly on every panel navigation while the server renders the next screen. */
export default function Loading() {
  return (
    <div className="grid animate-pulse gap-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-56 rounded-md bg-paper-2" />
      <div className="h-4 w-96 max-w-full rounded bg-paper-2" />
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg border border-rule bg-surface" />
        ))}
      </div>
    </div>
  );
}
