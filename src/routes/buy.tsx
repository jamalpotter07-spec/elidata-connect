// buy.tsx
// All bundles. Header, network tabs, then the deals. Nothing else in the way.
// Bundles are grouped by size (Starter, Value, Power, Max) in collapsible sections.
// All 90 day bundles show as "Non-Expiry".

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveBundles } from "@/lib/bundles.functions";
import { NavBar } from "@/components/nav-bar";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { OfferCard } from "@/components/offer-card";
import { ArrowLeft, ChevronDown } from "lucide-react";

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
  original_price_ghs?: number | null;
};
type Network = "MTN" | "Telecel" | "AT";

const NETWORKS: { id: Network; label: string }[] = [
  { id: "MTN", label: "MTN" },
  { id: "Telecel", label: "Telecel" },
  { id: "AT", label: "Airtel-Tigo" },
];

const CATEGORIES = [
  { key: "starter", label: "Starter", subtitle: "Up to 2 GB", test: (mb: number) => mb <= 2048 },
  { key: "value", label: "Value", subtitle: "3 to 9 GB", test: (mb: number) => mb > 2048 && mb < 10240 },
  { key: "power", label: "Power", subtitle: "10 to 29 GB", test: (mb: number) => mb >= 10240 && mb < 30720 },
  { key: "max", label: "Max", subtitle: "30 GB and up", test: (mb: number) => mb >= 30720 },
] as const;

const GRID = "repeat(auto-fill, minmax(10rem, 1fr))";

// ── Collapsible size group ────────────────────────────────────────────────────
function CategorySection({
  category, bundles, onBuy, defaultOpen,
}: {
  category: (typeof CATEGORIES)[number];
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
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-border py-2 text-left"
        aria-expanded={open}
      >
        <p id={headingId} className="font-heading text-base font-semibold text-foreground">
          {category.label}
          <span className="ml-2 text-sm font-normal text-muted-foreground">{category.subtitle}</span>
        </p>
        <span className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-0.5 text-sm text-muted-foreground">
            {bundles.length} plan{bundles.length !== 1 ? "s" : ""}
          </span>
          <ChevronDown
            className="h-5 w-5 text-muted-foreground transition-transform duration-300"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </span>
      </button>

      {open && (
        <div className="mb-8 mt-4 grid gap-3" style={{ gridTemplateColumns: GRID }}>
          {bundles.map((b, i) => (
            <div key={b.id} style={{ animation: `scale-in 0.35s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both` }}>
              <OfferCard
                bundle={{
                  ...b,
                  // 90 day bundles are marketed as Non-Expiry. The DB value is untouched.
                  validity: /90\s*days?/i.test(b.validity) ? "Non-Expiry" : b.validity,
                }}
                onBuy={onBuy}
                showCancelled
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="flex flex-col gap-8" aria-hidden>
      {[4, 4].map((count, si) => (
        <div key={si}>
          <div className="mb-4 h-5 w-32 animate-pulse rounded-full bg-muted" />
          <div className="grid gap-3" style={{ gridTemplateColumns: GRID }}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse bg-muted" style={{ borderRadius: "1.75rem 0.75rem 1.75rem 0.75rem" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export const Route = createFileRoute("/buy")({
  validateSearch: (search: Record<string, unknown>): { network?: Network } => ({
    network: (search.network as Network | undefined) ?? undefined,
  }),
  component: BuyPage,
  head: () => ({
    meta: [
      { title: "Buy Data Bundles | Eli Data Resales" },
      {
        name: "description",
        content:
          "Browse all MTN, Telecel and Airtel-Tigo data bundles at reseller prices in Ghana. Non-expiry bundles delivered instantly.",
      },
    ],
  }),
});

function BuyPage() {
  const navigate = useNavigate();
  const { network: init } = Route.useSearch();
  const [activeNet, setActiveNet] = useState<Network>(init ?? "MTN");
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const fetchBundles = useServerFn(listActiveBundles);
  const { data, isLoading } = useQuery({
    queryKey: ["bundles"],
    queryFn: () => fetchBundles(),
  });

  const bundles = (data?.bundles ?? []) as Bundle[];
  const filtered = bundles.filter((b) => b.network === activeNet);
  const onBuy = (b: Bundle) => {
    setSelected(b);
    setCheckoutOpen(true);
  };

  const buckets = CATEGORIES.map((cat) => ({
    category: cat,
    bundles: filtered.filter((b) => cat.test(b.data_mb)),
  })).filter((b) => b.bundles.length > 0);

  const total = filtered.length;

  return (
    <>
      <NavBar />
      <WhatsAppFloat />

      <main style={{ paddingTop: "96px", minHeight: "100svh" }}>
        <div className="page">
          {/* Header */}
          <div
            className="mb-6 flex items-center gap-3"
            style={{ animation: "slide-up 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition active:scale-95 hover:bg-accent"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">All bundles</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isLoading ? "Loading" : `${total} plan${total !== 1 ? "s" : ""}, Non-Expiry`}
              </p>
            </div>
          </div>

          {/* Network tabs */}
          <div
            className="network-strip mb-8 max-w-full overflow-x-auto"
            style={{ animation: "fade-in 0.4s ease 0.1s both" }}
            role="tablist"
            aria-label="Select network"
          >
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                role="tab"
                aria-selected={activeNet === n.id}
                className={`network-tab ${activeNet === n.id ? "active" : ""}`}
                onClick={() => {
                  setActiveNet(n.id);
                  navigate({ to: "/buy", search: { network: n.id } });
                }}
              >
                {n.label}
              </button>
            ))}
          </div>

          {/* Bundles */}
          {isLoading ? (
            <SkeletonGrid />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-20 text-center">
              <p className="font-heading text-base font-semibold text-foreground">No bundles available</p>
              <p className="text-sm text-muted-foreground">No active plans for this network right now. Check back soon.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {buckets.map(({ category, bundles: catBundles }, idx) => (
                <CategorySection
                  key={`${activeNet}-${category.key}`}
                  category={category}
                  bundles={catBundles}
                  onBuy={onBuy}
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
