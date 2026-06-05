export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <span className="relative inline-flex h-10 w-10 items-center justify-center">
        <svg viewBox="0 0 48 48" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="eli-shell" x1="7" y1="6" x2="41" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--brand-navy-2))" />
              <stop offset="100%" stopColor="hsl(var(--brand-orange))" />
            </linearGradient>
            <linearGradient id="eli-core" x1="15" y1="15" x2="34" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="hsl(var(--brand-orange))" />
              <stop offset="100%" stopColor="hsl(var(--brand-navy-2))" />
            </linearGradient>
          </defs>
          <rect x="4.5" y="4.5" width="39" height="39" rx="12" fill="none" stroke="url(#eli-shell)" strokeWidth="1.8" />
          <path d="M15 15.5h17.5" stroke="url(#eli-shell)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M15 24h14" stroke="url(#eli-shell)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M15 32.5h17.5" stroke="url(#eli-shell)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M15 15.5v17" stroke="url(#eli-core)" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M32.5 15.5v17" stroke="url(#eli-core)" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="24" cy="24" r="3.4" fill="hsl(var(--brand-orange))" />
        </svg>
      </span>
    </div>
  );
}
