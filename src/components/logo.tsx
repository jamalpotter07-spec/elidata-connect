export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lg-ring" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="hsl(var(--brand-navy))" />
            <stop offset="100%" stopColor="hsl(var(--brand-navy-2))" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="17" stroke="url(#lg-ring)" strokeWidth="3" strokeLinecap="round" strokeDasharray="80 30" />
        <rect x="11" y="20" width="3.5" height="9" rx="1" fill="hsl(var(--brand-navy))" />
        <rect x="16.5" y="15" width="3.5" height="14" rx="1" fill="hsl(var(--brand-navy))" />
        <rect x="22" y="10" width="3.5" height="19" rx="1" fill="hsl(var(--brand-navy))" />
        <path d="M14 22 L19 27 L29 14" stroke="hsl(var(--brand-orange))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <div className="leading-tight">
        <div className="font-extrabold tracking-tight text-lg">
          <span style={{ color: "hsl(var(--brand-navy))" }}>Data</span>
          <span style={{ color: "hsl(var(--brand-orange))" }}>Plug</span>
          <span className="ml-1 text-xs font-semibold align-top text-muted-foreground">GH</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-0.5">Cheap data, instantly</div>
      </div>
    </div>
  );
}
