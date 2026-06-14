import logoImg from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center">
        <img
          src={logoImg}
          alt="Eli Data Resales logo"
          className="h-9 w-9 object-contain"
        />
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
