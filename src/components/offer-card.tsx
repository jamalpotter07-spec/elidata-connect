import mtnLogo    from "@/assets/mtn.png";
import telecelLogo from "@/assets/telecel.png";
import atLogo     from "@/assets/AT.png";

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
};

const NET: Record<string, {
  logo: string;
  logoBg: string;
  accentGlow: string;
  logoFit: "contain" | "cover";
  logoPadding: string;
}> = {
  MTN: {
    logo:        mtnLogo,
    logoBg:      "linear-gradient(135deg, #FFCC00 0%, #e6b800 100%)",
    accentGlow:  "rgba(255, 204, 0, 0.35)",
    logoFit:     "contain",
    logoPadding: "16px 12px",
  },
  Telecel: {
    logo:        telecelLogo,
    logoBg:      "linear-gradient(135deg, #E30613 0%, #aa0010 100%)",
    accentGlow:  "rgba(227, 6, 19, 0.35)",
    logoFit:     "contain",
    logoPadding: "20px",
  },
  AT: {
    logo:        atLogo,
    logoBg:      "linear-gradient(135deg, #E30613 0%, #002868 100%)",
    accentGlow:  "rgba(0, 40, 104, 0.40)",
    logoFit:     "contain",
    logoPadding: "14px",
  },
};

function formatGb(data_mb: number) {
  const gb = data_mb / 1024;
  return gb % 1 === 0 ? `${gb}` : gb.toFixed(1);
}
function cancelledPrice(price: number) {
  return (price * 1.10).toFixed(2);
}

export function OfferCard({
  bundle, onBuy, showCancelled = false,
}: {
  bundle: Bundle; onBuy: (b: Bundle) => void; showCancelled?: boolean;
}) {
  const net          = NET[bundle.network] ?? NET["MTN"];
  const gbLabel      = formatGb(bundle.data_mb);
  const cancelled    = cancelledPrice(bundle.price_ghs);
  const validityShort = bundle.validity?.replace(" days", "d") ?? "30d";

  return (
    <div
      className="offer-card offer-card-sheen relative flex flex-col cursor-pointer"
      style={{ minHeight: "210px" }}
      onClick={() => onBuy(bundle)}
    >
      {/* Scanline texture */}
      <div className="scanline" />

      {/* ── TOP: network logo ── */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: "58%", background: net.logoBg, padding: net.logoPadding }}
      >
        <img
          src={net.logo}
          alt={bundle.network}
          style={{
            objectFit: net.logoFit,
            width: "100%", height: "100%",
            maxHeight: "68px",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.25))",
          }}
        />
        {/* Validity badge */}
        <span
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-white font-bold"
          style={{
            background:      "rgba(0,0,0,0.65)",
            backdropFilter:  "blur(8px)",
            border:          "1px solid rgba(255,255,255,0.12)",
            fontSize:        "7px",
            writingMode:     "vertical-rl",
            textOrientation: "mixed",
            transform:       "rotate(180deg)",
            lineHeight:      1.1,
            letterSpacing:   "0.04em",
          }}
        >
          {validityShort}
        </span>
      </div>

      {/* ── BOTTOM: info + CTA ── */}
      <div
        className="flex flex-col justify-between flex-1 px-3 pt-2 pb-3 relative"
        style={{
          background:      "rgba(255,255,255,0.04)",
          backdropFilter:  "blur(8px)",
          borderTop:       "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Data size */}
        <div className="flex items-end gap-0.5 -mt-4 mb-1">
          <span
            className="font-black text-white leading-none"
            style={{ fontSize: "clamp(40px, 10vw, 58px)", fontFamily: "var(--font-display)" }}
          >
            {gbLabel}
          </span>
          <div className="flex flex-col mb-1 ml-1">
            <span
              className="font-bold leading-none"
              style={{ fontSize: "clamp(13px, 3vw, 17px)", color: "rgba(0,255,255,0.80)" }}
            >
              GB
            </span>
          </div>
        </div>

        {/* Price block */}
        <div className="flex flex-col gap-0.5">
          <span className="font-medium leading-none" style={{ fontSize: "9px", color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Price
          </span>
          {showCancelled && (
            <span className="line-through leading-none" style={{ fontSize: "clamp(11px, 2.8vw, 13px)", color: "#4b5563" }}>
              GHS {cancelled}
            </span>
          )}
          <span className="font-bold text-white leading-none" style={{ fontSize: "clamp(13px, 3.2vw, 16px)" }}>
            GHS {Number(bundle.price_ghs).toFixed(2)}
          </span>
        </div>

        {/* Buy button */}
        <button
          onClick={(e) => { e.stopPropagation(); onBuy(bundle); }}
          className="mt-2 w-full rounded-full py-1.5 text-xs font-bold transition-all hover:scale-[1.04] active:scale-[0.97]"
          style={{
            background:  "linear-gradient(135deg, #0066ff 0%, #0044cc 100%)",
            color:       "#ffffff",
            border:      "1px solid rgba(0,255,255,0.15)",
            boxShadow:   `0 4px 16px ${net.accentGlow}, 0 2px 8px rgba(0,102,255,0.30)`,
          }}
        >
          Buy
        </button>
      </div>
    </div>
  );
}
