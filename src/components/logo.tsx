import logoImg from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative inline-flex h-7 w-7 items-center justify-center shrink-0">
        <img
          src={logoImg}
          alt="Eli Data Resales logo"
          className="h-7 w-7 object-contain"
        />
      </span>
      <span className="flex items-baseline gap-1 leading-none">
        <span
          className="text-[13px] font-extrabold tracking-tight bg-gradient-to-r from-[hsl(var(--brand-navy-2))] to-[hsl(var(--brand-orange))] bg-clip-text text-transparent"
        >
          Eli
        </span>
        <span className="text-[13px] font-extrabold tracking-tight text-white">
          Data
        </span>
        <span className="text-[11px] font-semibold tracking-wide text-white/70">
          Resales
        </span>
      </span>
    </div>
  );
}
