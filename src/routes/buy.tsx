import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery }     from "@tanstack/react-query";
import { useServerFn }  from "@tanstack/react-start";
import { listActiveBundles } from "@/lib/bundles.functions";
import { NavBar }        from "@/components/nav-bar";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { OfferCard }     from "@/components/offer-card";
import { ArrowLeft }     from "lucide-react";

type Bundle  = { id: string; network: string; name: string; data_mb: number; price_ghs: number; validity: string; };
type Network = "MTN" | "Telecel" | "AT";

const NETWORKS: { id: Network; label: string; color: string; textColor: string }[] = [
  { id: "MTN",     label: "MTN",        color: "#FFCC00",                                   textColor: "#1a1200" },
  { id: "Telecel", label: "Telecel",     color: "#E30613",                                   textColor: "#ffffff" },
  { id: "AT",      label: "Airtel-Tigo", color: "linear-gradient(135deg,#E30613,#002868)",   textColor: "#ffffff" },
];

export const Route = createFileRoute("/buy")({
  validateSearch: (search: Record<string, unknown>) => ({
    network: (search.network as Network) ?? "MTN",
  }),
  component: BuyPage,
  head: () => ({
    meta: [
      { title: "Buy Data Bundles — Eli Data Resales" },
      { name: "description", content: "Browse all MTN, Telecel and Airtel-Tigo data bundles at reseller prices in Ghana." },
    ],
  }),
});

function BuyPage() {
  const navigate         = useNavigate();
  const { network: init } = Route.useSearch();
  const [activeNet, setActiveNet]       = useState<Network>(init);
  const [selected, setSelected]         = useState<Bundle | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const fetchBundles = useServerFn(listActiveBundles);
  const { data, isLoading } = useQuery({ queryKey: ["bundles"], queryFn: () => fetchBundles() });

  const bundles  = (data?.bundles ?? []) as Bundle[];
  const filtered = bundles.filter((b) => b.network === activeNet);
  const onBuy    = (b: Bundle) => { setSelected(b); setCheckoutOpen(true); };

  return (
    <>
      <NavBar />
      <WhatsAppFloat />

      <main
        className="pt-20 pb-24 lg:pb-10 min-h-screen"
        style={{ background: "var(--color-background)" }}
      >
        <div className="container mx-auto px-4 py-8 max-w-5xl">

          {/* Back + title */}
          <div className="flex items-center gap-3 mb-6" style={{ animation: "slide-up 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: "rgba(0,102,255,0.06)",
                border:     "1px solid rgba(0,102,255,0.12)",
              }}
            >
              <ArrowLeft className="h-4 w-4" style={{ color: "#0066ff" }} />
            </button>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
              >
                All bundles
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Select a network to filter</p>
            </div>
          </div>

          {/* Network tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {NETWORKS.map((n) => {
              const isActive    = activeNet === n.id;
              const bg          = n.id === "AT"
                ? isActive ? "linear-gradient(135deg,#E30613,#002868)" : "rgba(0,102,255,0.06)"
                : isActive ? n.color : "rgba(0,102,255,0.06)";
              const color       = isActive
                ? n.id === "MTN" ? "#1a1200" : "#ffffff"
                : "var(--color-muted-foreground)";
              const borderColor = isActive ? "transparent" : "rgba(0,102,255,0.12)";
              return (
                <button
                  key={n.id}
                  onClick={() => { setActiveNet(n.id); navigate({ to: "/buy", search: { network: n.id } }); }}
                  className="rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.04]"
                  style={{ background: bg, color, border: `1px solid ${borderColor}`, boxShadow: isActive ? "0 4px 16px rgba(0,0,0,0.14)" : "none" }}
                >
                  {n.label}
                </button>
              );
            })}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 rounded-3xl animate-pulse" style={{ background: "rgba(0,102,255,0.06)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-muted-foreground text-sm">No bundles available for this network yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((b, i) => (
                <div key={b.id} style={{ animation: `scale-in 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both` }}>
                  <OfferCard bundle={b} onBuy={onBuy} showCancelled={false} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <CheckoutDialog bundle={selected} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
