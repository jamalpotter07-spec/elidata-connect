// offer-card.tsx — redesigned bundle card
// Fixed aspect-ratio shape, no logos, network badge oval,
// live price comparison, pill validity tag, black buy button

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
  original_price_ghs?: number | null;
};

function formatGb(data_mb: number) {
  const gb = data_mb / 1024;
  return gb % 1 === 0 ? `${gb}` : gb.toFixed(1);
}

// Live price comparison:
// If original_price_ghs exists and is HIGHER → show it struck through (sale scenario)
// If original_price_ghs exists and is LOWER  → invert: show current as "New price", bold
// If no original_price_ghs → derive +10% as cancelled for visual interest only
function getPriceDisplay(price: number, original?: number | null) {
  if (original && original > price) {
    return {
      label:     "Price",
      cancelled: original.toFixed(2),
      real:      price.toFixed(2),
      isNewPrice: false,
    };
  }
  if (original && original < price) {
    return {
      label:     "New price",
      cancelled: price.toFixed(2),         // old (lower) price shown struck
      real:      original.toFixed(2),       // actually: show both, new bolder
      isNewPrice: true,
    };
  }
  // fallback — no DB original
  return {
    label:     "Price",
    cancelled: (price * 1.10).toFixed(2),
    real:      price.toFixed(2),
    isNewPrice: false,
  };
}

function NetBadge({ network }: { network: string }) {
  if (network === "MTN") {
    return <span className="net-badge-mtn">MTN</span>;
  }
  if (network === "Telecel") {
    return <span className="net-badge-telecel">Telecel</span>;
  }
  return <span className="net-badge-at">Airtel-Tigo</span>;
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
  const gbLabel      = formatGb(bundle.data_mb);
  const validityShort = bundle.validity?.replace(/\s*days?/i, "d") ?? "30d";
  const priceDisplay = getPriceDisplay(
    bundle.price_ghs,
    bundle.original_price_ghs,
  );

  return (
    <article
      className="bundle-card"
      onClick={() => onBuy(bundle)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onBuy(bundle)}
      aria-label={`Buy ${gbLabel}gb ${bundle.network} bundle for GHS ${priceDisplay.real}`}
    >
      {/* ── TOP SECTION: white, network badge + validity tag ── */}
      <div
        className="relative flex flex-col px-3 pt-3 pb-2"
        style={{ flex: "0 0 auto" }}
      >
        {/* Network badge — landscape oval */}
        <NetBadge network={bundle.network} />

        {/* Validity pill — right aligned, middle of card visually */}
        <span
          className="absolute right-3 top-3 inline-flex items-center justify-center rounded-full px-2 py-0.5"
          style={{
            background:    "#111111",
            color:         "#ffffff",
            fontFamily:    "var(--font-body)",
            fontWeight:    700,
            fontSize:      "0.6rem",
            letterSpacing: "0.04em",
            minWidth:      "28px",
          }}
        >
          {validityShort}
        </span>
      </div>

      {/* ── MIDDLE: data size — centred ── */}
      <div
        className="flex flex-col items-center justify-center px-3"
        style={{ flex: "1 1 0", minHeight: 0 }}
      >
        <div className="flex items-end justify-center gap-0.5 leading-none">
          <span
            style={{
              fontFamily:  "var(--font-hero)",
              fontWeight:  800,
              fontSize:    "clamp(38px, 11vw, 52px)",
              color:       "#111111",
              lineHeight:  1,
              letterSpacing: "-0.03em",
            }}
          >
            {gbLabel}
          </span>
          <span
            style={{
              fontFamily: "var(--font-hero)",
              fontWeight: 700,
              fontSize:   "clamp(16px, 5vw, 22px)",
              color:      "#111111",
              lineHeight: 1,
              paddingBottom: "3px",
            }}
          >
            gb
          </span>
        </div>
      </div>

      {/* ── BOTTOM: price + buy ── */}
      <div
        className="flex flex-col px-3 pb-3 gap-1.5"
        style={{ flex: "0 0 auto" }}
      >
        {/* Price label */}
        <p
          style={{
            fontFamily:    "var(--font-body)",
            fontWeight:    600,
            fontSize:      "0.6rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color:         "#888888",
            marginBottom:  "1px",
          }}
        >
          {priceDisplay.label}
        </p>

        {/* Cancelled price */}
        {showCancelled && (
          <span
            className="line-through"
            style={{
              fontFamily: "var(--font-body)",
              fontSize:   "0.7rem",
              color:      "#aaaaaa",
              lineHeight: 1,
            }}
          >
            GHS {priceDisplay.cancelled}
          </span>
        )}

        {/* Real price */}
        <span
          style={{
            fontFamily:  "var(--font-heading)",
            fontWeight:  priceDisplay.isNewPrice ? 900 : 700,
            fontSize:    "clamp(13px, 3.5vw, 16px)",
            color:       priceDisplay.isNewPrice ? "#e65100" : "#111111",
            lineHeight:  1,
          }}
        >
          GHS {priceDisplay.real}
        </span>

        {/* Buy button — black pill, not full width */}
        <button
          className="mx-auto mt-1"
          onClick={(e) => { e.stopPropagation(); onBuy(bundle); }}
          style={{
            background:    "#111111",
            color:         "#ffffff",
            border:        "none",
            borderRadius:  "9999px",
            fontFamily:    "var(--font-heading)",
            fontWeight:    700,
            fontSize:      "0.72rem",
            padding:       "6px 20px",
            cursor:        "pointer",
            letterSpacing: "0.02em",
            transition:    "opacity 0.15s, transform 0.15s",
            display:       "block",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.80")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseDown={(e)  => (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e)    => (e.currentTarget.style.transform = "scale(1)")}
          aria-label={`Buy ${gbLabel}gb ${bundle.network}`}
        >
          Buy
        </button>
      </div>
    </article>
  );
}
