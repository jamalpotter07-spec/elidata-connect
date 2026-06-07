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
          <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#eli-mark)" />
          {/* Stylized "e" mark — clearly a letter, not menu lines */}
          <path
            d="M28 21.2c0-5-3.4-8.4-8.2-8.4-4.9 0-8.4 3.6-8.4 8.6s3.5 8.6 8.6 8.6c3 0 5.6-1.3 7.2-3.5l-3-2.1c-1 1.3-2.5 2-4.2 2-2.4 0-4.2-1.4-4.7-3.6H28v-1.6Zm-12.7-1.9c.6-2.1 2.3-3.4 4.5-3.4s3.8 1.3 4.3 3.4h-8.8Z"
            fill="white"
          />
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
