export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <svg viewBox="0 0 40 40" className="h-9 w-9" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="eli-mark" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--brand-navy-2))" />
              <stop offset="100%" stopColor="hsl(var(--brand-orange))" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#eli-mark)" />
          <path d="M12 13h14M12 20h11M12 27h14" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-[hsl(var(--brand-navy-2))] to-[hsl(var(--brand-orange))] bg-clip-text text-transparent">
            Eli
          </span>
          <span className="text-foreground"> Data</span>
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Resales
        </span>
      </span>
    </div>
  );
}
