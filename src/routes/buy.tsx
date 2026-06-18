// buy.tsx
// Patch 10 — Group bundles by size category instead of flat dump.
//            Categories: Starter (≤2GB), Value (3–9GB), Power (10–29GB), Max (30GB+)
//            Each category is a collapsible section — collapsed by default on mobile,
//            expanded on desktop. This replaces the overwhelming single flat grid.
// Patch 11 (baked in) — Display "Non-Expiry" label when validity contains "90 days"
//            instead of showing the raw "90 days" string. All current bundles use 90 days
//            which matches MyDataBundles' "Non-Expiry" marketing language for Ghana.

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useId } from "react";
import { useQuery }        from "@tanstack/react-query";
import { useServerFn }     from "@tanstack/react-start";
import { listActiveBundles } from "@/lib/bundles.functions";
import { NavBar }          from "@/components/nav-bar";
import { CheckoutDialog }  from "@/components/checkout-dialog";
import { WhatsAppFloat }   from "@/components/whatsapp-float";
import { OfferCard }       from "@/components/offer-card";
import { ArrowLeft, ChevronDown, Infinity } from "lucide-react";
import { ServiceStatusBanner } from "@/components/service-status-banner";

type Bundle  = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
  original_price_ghs?: number | null;
};
type Network = "MTN" | "Telecel" | "AT";

const NETWORKS: { id: Network; label: string }[] = [
  { id: "MTN",     label: "MTN"         },
  { id: "Telecel", label: "Telecel"      },
  { id: "AT",      label: "Airtel-Tigo"  },
];

// ── Category buckets ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "starter", label: "Starter",  subtitle: "Up to 2 GB",   test: (mb: number) => mb <= 2048  },
  { key: "value",   label: "Value",    subtitle: "3 GB – 9 GB",  test: (mb: number) => mb > 2048  && mb < 10240 },
  { key: "power",   label: "Power",    subtitle: "10 GB – 29 GB",test: (mb: number) => mb >= 10240 && mb < 30720 },
  { key: "max",     label: "Max",      subtitle: "30 GB +",      test: (mb: number) => mb >= 30720 },
] as const;

// ── Validity label — Patch 11 ─────────────────────────────────────────────────
// "90 days" → "Non-Expiry" to match Ghana reseller market language.
function validityLabel(validity: string): React.ReactNode {
  if (/90\s*days?/i.test(validity)) {
    return (
      <span className="inline-flex items-center gap-1">
        <Infinity style={{ width: "10px", height: "10px" }} strokeWidth={2.5} />
        Non-Expiry
      </span>
    );
  }
  return validity;
}

// ── Network colour helpers ────────────────────────────────────────────────────
function netActiveBg(id: Network) {
  if (id === "MTN")     return "#FFCC00";
  if (id === "Telecel") return "#E30613";
  return "linear-gradient(135deg,#E30613,#002868)";
}
function netActiveColor(id: Network) {
  return id === "MTN" ? "#1a1200" : "#ffffff";
}

// ── Category section (collapsible) ───────────────────────────────────────────
function CategorySection({
  category,
  bundles,
  onBuy,
  defaultOpen,
}: {
  category: typeof CATEGORIES[number];
  bundles: Bundle[];
  onBuy: (b: Bundle) => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const headingId = useId();

  if (bundles.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      style={{ animation: "slide-up 0.45s cubic-bezier(0.22,1,0.36,1) both" }}
    >
      {/* Category header — tappable toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
        style={{
          padding:      "10px 0",
          borderBottom: open ? "1px solid var(--border)" : "1px solid transparent",
          marginBottom: open ? "16px" : "0",
          transition:   "border-color 0.2s, margin-bottom 0.2s",
          background:   "transparent",
          border:       "none",
          cursor:       "pointer",
        }}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          {/* Coloured dot */}
          <span
            style={{
              width:        "10px",
              height:       "10px",
              borderRadius: "50%",
              background:   "var(--primary)",
              flexShrink:   0,
              opacity:      open ? 1 : 0.45,
              transition:   "opacity 0.2s",
            }}
          />
          <div>
            <p
              id={headingId}
              style={{
                fontFamily:    "var(--font-heading)",
                fontWeight:    700,
                fontSize:      "0.95rem",
                color:         "var(--foreground)",
                lineHeight:    1.2,
              }}
            >
              {category.label}
              <span
                style={{
                  fontFamily:  "var(--font-body)",
                  fontWeight:  400,
                  fontSize:    "0.75rem",
                  color:       "var(--muted-foreground)",
                  marginLeft:  "8px",
                }}
              >
                {category.subtitle}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            style={{
              fontFamily:    "var(--font-body)",
              fontSize:      "0.72rem",
              color:         "var(--muted-foreground)",
              background:    "var(--muted)",
              borderRadius:  "9999px",
              padding:       "2px 8px",
            }}
          >
            {bundles.length} plan{bundles.length !== 1 ? "s" : ""}
          </span>
          <span
            style={{
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              width:           "24px",
              height:          "24px",
              borderRadius:    "50%",
              background:      "var(--muted)",
              transition:      "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
              transform:       open ? "rotate(180deg)" : "rotate(0deg)",
              flexShrink:      0,
            }}
          >
            <ChevronDown style={{ width: "13px", height: "13px", color: "var(--muted-foreground)" }} />
          </span>
        </div>
      </button>

      {/* Cards grid — animated expand/collapse */}
      <div
        style={{
          display:        open ? "grid" : "none",
          gridTemplateColumns: "repeat(auto-fill, minmax(148px, 180px))",
          gap:            "12px",
          marginBottom:   "28px",
        }}
      >
        {bundles.map((b, i) => (
          <div
            key={b.id}
            style={{ animation: `scale-in 0.35s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both` }}
          >
            <OfferCard
              bundle={{
                ...b,
                // Patch 11 — override validity display without touching the DB value
                validity: /90\s*days?/i.test(b.validity) ? "Non-Expiry" : b.validity,
              }}
              onBuy={onBuy}
              showCancelled
            />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Buy page skeleton loader ──────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="flex flex-col gap-6">
      {[3, 4, 3].map((count, si) => (
        <div key={si}>
          <div
            className="animate-pulse rounded-full mb-4"
            style={{ width: "120px", height: "14px", background: "var(--muted)" }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(148px, 180px))",
              gap: "12px",
            }}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-3xl"
                style={{ aspectRatio: "3/4", background: "var(--muted)", maxWidth: "180px" }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/buy")({
  validateSearch: (search: Record<string, unknown>) => ({
    network: (search.network as Network) ?? "MTN",
  }),
  component: BuyPage,
  head: () => ({
    meta: [
      { title: "Buy Data Bundles — Eli Data Resales" },
      {
        name: "description",
        content:
          "Browse all MTN, Telecel and Airtel-Tigo data bundles at reseller prices in Ghana. Non-expiry bundles delivered instantly.",
      },
    ],
  }),
});

function BuyPage() {
  const navigate          = useNavigate();
  const { network: init } = Route.useSearch();
  const [activeNet,     setActiveNet]     = useState<Network>(init);
  const [selected,      setSelected]      = useState<Bundle | null>(null);
  const [checkoutOpen,  setCheckoutOpen]  = useState(false);

  const fetchBundles = useServerFn(listActiveBundles);
  const { data, isLoading } = useQuery({
    queryKey: ["bundles"],
    queryFn:  () => fetchBundles(),
  });

  const bundles  = (data?.bundles ?? []) as Bundle[];
  const filtered = bundles.filter((b) => b.network === activeNet);
  const onBuy    = (b: Bundle) => { setSelected(b); setCheckoutOpen(true); };

  // Split filtered bundles into category buckets
  const buckets = CATEGORIES.map((cat) => ({
    category: cat,
    bundles:  filtered.filter((b) => cat.test(b.data_mb)),
  })).filter((b) => b.bundles.length > 0);

  const totalBundles = filtered.length;

  return (
    <>
      <NavBar />
      <WhatsAppFloat />

      <main
        style={{
          paddingTop:    "80px",
          paddingBottom: "100px",
          minHeight:     "100svh",
          background:    "var(--background)",
        }}
      >
        <div className="mx-auto px-4 max-w-5xl">

          {/* ── Header ── */}
          <div
            className="flex items-center gap-3 mb-6"
            style={{ animation: "slide-up 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                width:      "36px",
                height:     "36px",
                background: "var(--muted)",
                border:     "1px solid var(--border)",
                flexShrink: 0,
              }}
              aria-label="Back to home"
            >
              <ArrowLeft style={{ width: "16px", height: "16px", color: "var(--muted-foreground)" }} />
            </button>
            <div>
              <h1
                style={{
                  fontFamily:    "var(--font-hero)",
                  fontWeight:    800,
                  fontSize:      "1.5rem",
                  letterSpacing: "-0.02em",
                  color:         "var(--foreground)",
                  lineHeight:    1.1,
                }}
              >
                All bundles
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize:   "0.75rem",
                  color:      "var(--muted-foreground)",
                  marginTop:  "2px",
                }}
              >
                {isLoading ? "Loading…" : `${totalBundles} plan${totalBundles !== 1 ? "s" : ""} · Non-Expiry · Instant delivery`}
              </p>
            </div>
          </div>

          {/* ── Service status + USSD banner ── */}
          <ServiceStatusBanner />

          {/* ── Network tabs ── */}
          <div
            className="flex gap-2 mb-8 flex-wrap"
            style={{ animation: "fade-in 0.4s ease 0.1s both" }}
            role="tablist"
            aria-label="Select network"
          >
            {NETWORKS.map((n) => {
              const isActive = activeNet === n.id;
              return (
                <button
                  key={n.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveNet(n.id);
                    navigate({ to: "/buy", search: { network: n.id } });
                  }}
                  style={{
                    background:   isActive ? netActiveBg(n.id) : "var(--muted)",
                    color:        isActive ? netActiveColor(n.id) : "var(--muted-foreground)",
                    border:       "1.5px solid",
                    borderColor:  isActive ? "transparent" : "var(--border)",
                    borderRadius: "9999px",
                    padding:      "8px 20px",
                    fontFamily:   "var(--font-heading)",
                    fontWeight:   700,
                    fontSize:     "0.82rem",
                    cursor:       "pointer",
                    boxShadow:    isActive ? "0 4px 16px rgba(0,0,0,0.14)" : "none",
                    transition:   "all 0.2s cubic-bezier(0.22,1,0.36,1)",
                    transform:    isActive ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  {n.label}
                </button>
              );
            })}
          </div>

          {/* ── Non-expiry badge strip ── */}
          {!isLoading && totalBundles > 0 && (
            <div
              className="flex items-center gap-2 mb-6 rounded-2xl px-4 py-3"
              style={{
                background: "rgba(230,81,0,0.06)",
                border:     "1px solid rgba(230,81,0,0.15)",
                animation:  "fade-in 0.4s ease 0.15s both",
              }}
            >
              <Infinity
                style={{ width: "14px", height: "14px", color: "var(--primary)", flexShrink: 0 }}
                strokeWidth={2.5}
              />
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize:   "0.75rem",
                  color:      "var(--foreground)",
                  lineHeight: 1.5,
                }}
              >
                <strong style={{ fontWeight: 700 }}>All bundles are Non-Expiry</strong>
                {" — "}data never expires. Check balance after delivery:{" "}
                <code style={{ fontWeight: 700, fontSize: "0.72rem" }}>*124#</code> (MTN)
                {" · "}
                <code style={{ fontWeight: 700, fontSize: "0.72rem" }}>*110#</code> (Telecel)
                {" · "}
                <code style={{ fontWeight: 700, fontSize: "0.72rem" }}>*100#</code> (AT)
              </p>
            </div>
          )}

          {/* ── Bundle list ── */}
          {isLoading ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  fontSize:   "0.9rem",
                  color:      "var(--foreground)",
                }}
              >
                No bundles available
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "var(--muted-foreground)" }}>
                No active plans for {activeNet} at the moment — check back soon.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {buckets.map(({ category, bundles: catBundles }, idx) => (
                <CategorySection
                  key={category.key}
                  category={category}
                  bundles={catBundles}
                  onBuy={onBuy}
                  // First category open by default on all screens;
                  // remaining categories open by default only on md+ (≥768px)
                  defaultOpen={idx === 0 || (typeof window !== "undefined" && window.innerWidth >= 768)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <CheckoutDialog bundle={selected} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
