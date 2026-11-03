import logoMark from "@/assets/logo-mark.png";

// The mark is a transparent PNG used as a mask, so it takes the current text
// colour: dark on light pages, light on dark pages. Never invisible.
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  const mask = `url(${logoMark}) center / contain no-repeat`;
  return (
    <span
      role="img"
      aria-label="Eli Data Resales logo"
      className={`inline-block shrink-0 bg-foreground ${className}`}
      style={{ WebkitMask: mask, mask }}
    />
  );
}

export function Logo({ className = "", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.125rem] font-semibold tracking-tight text-foreground">
            Eli Data
          </span>
          <span className="mt-0.5 text-sm font-medium text-muted-foreground">Resales</span>
        </span>
      )}
    </div>
  );
}
