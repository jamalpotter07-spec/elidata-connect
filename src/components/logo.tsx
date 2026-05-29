// Eli Data Resales — wordmark + signal-wave glyph.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center">
        <svg viewBox="0 0 44 44" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="eli-grad" x1="0" y1="0" x2="44" y2="44">
              <stop offset="0%" stopColor="hsl(var(--brand-navy-2))" />
              <stop offset="100%" stopColor="hsl(var(--brand-orange))" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="40" height="40" rx="12" fill="url(#eli-grad)" />
          {/* Signal waves */}
          <path d="M14 26 Q22 18 30 26" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M11 30 Q22 16 33 30" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.35" />
          {/* E letter mark */}
          <path
            d="M17 14 H28 M17 14 V30 H28 M17 22 H26"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Live dot */}
          <circle cx="33" cy="11" r="3" fill="#22c55e" />
          <circle cx="33" cy="11" r="3" fill="#22c55e" className="animate-ping origin-center" style={{ transformOrigin: "33px 11px" }} opacity="0.6" />
        </svg>
      </span>
      <div className="leading-tight">
        <div className="font-extrabold tracking-tight text-[17px]">
          <span className="text-foreground">Eli</span>
          <span className="text-[hsl(var(--brand-orange))]">Data</span>
        </div>
        <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground -mt-0.5">
          Resales · Ghana
        </div>
      </div>
    </div>
  );
}
