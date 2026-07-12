// service-status-banner.tsx — 24/7 USSD-only banner, no time-gating.
import { Wifi, Zap } from "lucide-react";

const USSD_CODES = [
  { network: "MTN",     code: "*124#", color: "#e6b800", bg: "#111111" },
  { network: "Telecel", code: "*110#", color: "#ffffff", bg: "#E30613" },
  { network: "AT",      code: "*100#", color: "#ffffff", bg: "linear-gradient(135deg,#E30613,#002868)" },
] as const;

export function ServiceStatusBanner() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:   "rgba(230,81,0,0.05)",
        border:       "1px solid rgba(230,81,0,0.14)",
        marginBottom: "20px",
        animation:    "slide-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <div className="px-4 py-3 flex flex-col gap-3">
        {/* 24/7 badge */}
        <div className="flex items-center gap-2">
          <span style={{
            display:"flex",alignItems:"center",justifyContent:"center",
            width:"22px",height:"22px",borderRadius:"50%",
            background:"rgba(230,81,0,0.10)",flexShrink:0,
          }}>
            <Zap style={{ width:"11px",height:"11px",color:"#e65100" }} strokeWidth={2.5} />
          </span>
          <p style={{ fontFamily:"var(--font-heading)",fontWeight:700,fontSize:"0.78rem",color:"var(--foreground)" }}>
            Instant delivery, 24/7 — all day, every day
          </p>
        </div>

        {/* USSD codes */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Wifi style={{ width:"10px",height:"10px",color:"var(--muted-foreground)" }} strokeWidth={2} />
            <span style={{
              fontFamily:"var(--font-eyebrow)",fontSize:"0.58rem",
              letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--muted-foreground)",
            }}>
              Check balance after delivery
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {USSD_CODES.map(({ network, code, color, bg }) => (
              <div key={network} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{ background:"var(--card)",border:"1px solid var(--border)" }}>
                <span style={{
                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                  width:"18px",height:"18px",borderRadius:"50%",background:bg,flexShrink:0,
                }}>
                  <span style={{ fontFamily:"var(--font-heading)",fontWeight:900,fontSize:"0.38rem",color,lineHeight:1 }}>
                    {network === "AT" ? "AT" : network.slice(0,3)}
                  </span>
                </span>
                <code style={{ fontFamily:"monospace",fontWeight:700,fontSize:"0.78rem",color:"var(--foreground)",letterSpacing:"0.02em" }}>
                  {code}
                </code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
