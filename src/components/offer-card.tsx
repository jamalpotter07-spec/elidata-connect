// offer-card.tsx: bundle card
// Network chip, big size, validity, price, one Buy button.
// Every colour is a theme token, so the card reads in light and dark.

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
  original_price_ghs?: number | null;
};

function formatGb(data_mb: number) {
  const gb = data_mb / 1024;
  return gb % 1 === 0 ? `${gb}` : gb.toFixed(1);
}

// original_price_ghs higher than price  -> show it struck through (sale)
// original_price_ghs lower than price   -> price went up: show the new price in accent colour
// no original_price_ghs                 -> struck price is price + 10% (visual only)
function getPriceDisplay(price: number, original?: number | null) {
  if (original && original > price) {
    return { cancelled: original.toFixed(2), real: price.toFixed(2), isNewPrice: false };
  }
  if (original && original < price) {
    return { cancelled: price.toFixed(2), real: original.toFixed(2), isNewPrice: true };
  }
  return { cancelled: (price * 1.1).toFixed(2), real: price.toFixed(2), isNewPrice: false };
}

function NetBadge({ network }: { network: string }) {
  if (network === "MTN") return <span className="net-badge-mtn">MTN</span>;
  if (network === "Telecel") return <span className="net-badge-telecel">Telecel</span>;
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
  const gbLabel = formatGb(bundle.data_mb);
  const validity = bundle.validity || "30 days";
  const priceDisplay = getPriceDisplay(bundle.price_ghs, bundle.original_price_ghs);

  return (
    <article
      className="bundle-card"
      onClick={() => onBuy(bundle)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBuy(bundle);
        }
      }}
      aria-label={`Buy ${gbLabel}GB ${bundle.network} bundle for GHS ${priceDisplay.real}`}
    >
      <div>
        <NetBadge network={bundle.network} />
      </div>

      <div className="mt-3 flex-1">
        <p className="flex items-baseline gap-1 leading-none text-foreground">
          <span className="font-display text-[2.75rem] font-semibold tracking-tight">{gbLabel}</span>
          <span className="font-display text-xl font-semibold">GB</span>
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{validity}</p>
      </div>

      <div className="mt-3">
        {showCancelled && (
          <p className="text-sm leading-tight text-muted-foreground line-through">
            GHS {priceDisplay.cancelled}
          </p>
        )}
        <p
          className={`whitespace-nowrap font-heading text-lg font-bold leading-tight ${priceDisplay.isNewPrice ? "text-primary" : "text-foreground"}`}
        >
          GHS {priceDisplay.real}
        </p>
      </div>

      <button
        type="button"
        className="btn-orange mt-3 w-full"
        style={{ minHeight: "44px" }}
        onClick={(e) => {
          e.stopPropagation();
          onBuy(bundle);
        }}
        aria-label={`Buy ${gbLabel}GB ${bundle.network}`}
      >
        Buy
      </button>
    </article>
  );
}
