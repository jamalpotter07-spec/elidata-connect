import logoImg from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Logo PNG — larger, pinned left */}
      <img
        src={logoImg}
        alt="Eli Data Resales logo"
        className="h-9 w-9 object-contain shrink-0"
      />
      {/* Text block */}
      <span className="flex flex-col leading-none gap-[1px]">
        {/* "Eli Data" — pink/purple/orange gradient */}
        <span
          className="text-[13px] font-extrabold tracking-tight"
          style={{
            background: "linear-gradient(90deg, #f472b6 0%, #a855f7 50%, #f97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Eli Data
        </span>
        {/* "Resales" — adaptive colour */}
        <span className="text-[11px] font-semibold tracking-wide text-foreground/70">
          Resales
        </span>
      </span>
    </div>
  );
}
