import mtnLogo from "@/assets/mtn.png";
import telecelLogo from "@/assets/telecel.png";
import atLogo from "@/assets/AT.png";

type Bundle = {
  id: string;
  network: string;
  name: string;
  data_mb: number;
  price_ghs: number;
  validity: string;
};

const cardSheen = `
@keyframes card-sheen {
  0% { transform: translateX(-160%) skewX(-20deg); }
  100% { transform: translateX(260%) skewX(-20deg); }
}
.offer-card-sheen::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.09) 50%, transparent 100%);
  transform: translateX(-160%) skewX(-20deg);
  animation: card-sheen 3.8s ease-in-out infinite;
  pointer-events: none;
}
`;

/* Network config */
const NET: Record<string, {
  logo: string;
  logoBg: string;         /* top 60% background */
  accentColor: string;    /* buy button + highlights */
  logoFit: "contain" | "cover";
  logoPadding: string;    /* padding around logo in top area */
}> = {
  MTN: {
    logo: mtnLogo,
    logoBg: "linear-gradient(135deg, #FFCC00 0%, #f5c200 100%)",
    accentColor: "#1a1200",
    logoFit: "contain",
    logoPadding: "16px 12px",   /* wide 2:1 logo — give it breathing room */
  },
  Telecel: {
    logo: telecelLogo,
    logoBg: "linear-gradient(135deg, #E30613 0%, #b00010 100%)",
    accentColor: "#ffffff",
    logoFit: "contain",
    logoPadding: "20px",        /* small 200×200 — center with padding */
  },
  AT: {
    logo: atLogo,
    logoBg: "linear-gradient(135deg, #E30613 0%, #002868 100%)",
    accentColor: "#ffffff",
    logoFit: "contain",
    logoPadding: "14px",        /* square 447×447 — fits well */
  },
};

function formatGb(data_mb: number) {
  const gb = data_mb / 1024;
  return gb % 1 === 0 ? `${gb}` : gb.toFixed(1);
}

function cancelledPrice(price: number): string {
  /* synthetic cancelled price ~8–12% above real */
  return (price * 1.10).toFixed(2);
}

export function OfferCard({
  bundle,
  onBuy,
  showCancelled = false,
}: {
  bundle: Bundle;
  onBuy: (b: Bundle) => void;
  showCancelled?: boolean;
}) {
  const net = NET[bundle.network] ?? NET["MTN"];
  const gbLabel = formatGb(bundle.data_mb);
  const cancelled = cancelledPrice(bundle.price_ghs);
  const validityShort = bundle.validity?.replace(" days", "d") ?? "30d";

  return (
    <>
      <style>{cardSheen}</style>
      <div
        className="relative overflow-hidden rounded-2xl offer-card-sheen flex flex-col"
        style={{
          /* slightly reduced card — was minHeight 220, now 200 */
          minHeight: "200px",
          background: "rgba(20,24,48,0.72)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.13)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
        }}
      >
        {/* ── TOP 60%: network logo ── */}
        <div
          className="relative flex items-center justify-center overflow-hidden"
          style={{ height: "60%", background: net.logoBg, padding: net.logoPadding }}
        >
          <img
            src={net.logo}
            alt={bundle.network}
            style={{
              objectFit: net.logoFit,
              width: "100%",
              height: "100%",
              maxHeight: "72px",
            }}
          />

          {/* Validity badge — top right, 90deg rotated text in black circle */}
          <span
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-white font-bold"
            style={{
              background: "rgba(0,0,0,0.75)",
              fontSize: "7px",
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
              lineHeight: 1.1,
              letterSpacing: "0.04em",
            }}
          >
            {validityShort}
          </span>
        </div>

        {/* ── BOTTOM 40%: tinted glass ── */}
        <div
          className="flex flex-col justify-between flex-1 px-3 pt-2 pb-3 relative"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderTop: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {/* Data size + GB — straddles top of bottom half */}
          <div className="flex items-end gap-0.5 -mt-4 mb-1">
            <span
              className="font-black text-white leading-none"
              style={{ fontSize: "clamp(42px, 11vw, 62px)" }}  /* 40% bigger than before */
            >
              {gbLabel}
            </span>
            <div className="flex flex-col mb-1 ml-1">
              <span
                className="font-bold text-white/90 leading-none"
                style={{ fontSize: "clamp(13px, 3.5vw, 18px)" }}
              >
                GB
              </span>
            </div>
          </div>

          {/* Price block */}
          <div className="flex flex-col gap-0.5">
            {/* "Price" label — grey, smaller than GB */}
            <span
              className="font-medium leading-none"
              style={{ fontSize: "10px", color: "#9ca3af" }}
            >
              Price
            </span>

            {/* Cancelled amount — only on homepage cards */}
            {showCancelled && (
              <span
                className="line-through leading-none"
                style={{ fontSize: "clamp(11px, 3vw, 14px)", color: "#6b7280" }}
              >
                GHS {cancelled}
              </span>
            )}

            {/* Real price */}
            <span
              className="font-bold text-white leading-none"
              style={{ fontSize: "clamp(13px, 3.5vw, 17px)" }}
            >
              GHS {Number(bundle.price_ghs).toFixed(2)}
            </span>
          </div>

          {/* Buy button — full width pill */}
          <button
            onClick={() => onBuy(bundle)}
            className="mt-2 w-full rounded-full py-1.5 text-xs font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: "#111827", color: "#ffffff" }}
          >
            Buy
          </button>
        </div>
      </div>
    </>
  );
}
