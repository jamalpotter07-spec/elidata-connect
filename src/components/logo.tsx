// Eli Data Resales — circular monogram inspired by ET Tech reference.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center">
        <svg viewBox="0 0 44 44" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="eli-ring" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--brand-navy-2))" />
              <stop offset="100%" stopColor="hsl(var(--brand-orange))" />
            </linearGradient>
            <linearGradient id="eli-mono" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--brand-navy-2))" />
              <stop offset="100%" stopColor="hsl(var(--brand-orange))" />
            </linearGradient>
          </defs>
          {/* Outer ring */}
          <circle cx="22" cy="22" r="20" fill="none" stroke="url(#eli-ring)" strokeWidth="1.8" />
          {/* ED monogram */}
          <text
            x="22"
            y="22"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="900"
            fontSize="15"
            letterSpacing="-0.5"
            fill="url(#eli-mono)"
          >
            ED
          </text>
          {/* Live dot */}
          <circle cx="36" cy="9" r="2.6" fill="#22c55e" />
          <circle cx="36" cy="9" r="2.6" fill="#22c55e" className="animate-ping" opacity="0.5" />
        </svg>
      </span>
      <div className="leading-tight">
        <div
          className="font-extrabold tracking-tight text-[15px] bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, hsl(var(--brand-navy-2)), hsl(var(--brand-orange)))",
          }}
        >
          ELI DATA RESALES
        </div>
        <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground -mt-0.5">
          Ghana · Reseller
        </div>
      </div>
    </div>
  );
}
