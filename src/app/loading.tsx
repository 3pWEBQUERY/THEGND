export default function Loading() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="grid size-12 animate-pulse place-items-center rounded-2xl brand-surface">
          <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden>
            <path d="M12 2.5 21 12l-9 9.5L3 12z" opacity=".9" />
          </svg>
        </span>
        <span className="text-xs tracking-[0.2em] text-muted-foreground">LÄDT…</span>
      </div>
    </div>
  );
}
