import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveBundles } from "@/lib/bundles.functions";
import { NavBar } from "@/components/nav-bar";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { OfferCard } from "@/components/offer-card";
import { ArrowLeft } from "lucide-react";

type Bundle = {
  id: string;
  network: string;
  name: string;
  data_mb: number;
  price_ghs: number;
  validity: string;
};

type Network = "MTN" | "Telecel" | "AT";

const NETWORKS: { id: Network; label: string; color: string; textColor: string }[] = [
  { id: "MTN",     label: "MTN",        color: "#FFCC00",                                    textColor: "#1a1200" },
  { id: "Telecel", label: "Telecel",     color: "#E30613",                                    textColor: "#ffffff" },
  { id: "AT",      label: "Airtel-Tigo", color: "linear-gradient(135deg,#E30613,#002868)",    textColor: "#ffffff" },
];

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
        content: "Browse all MTN, Telecel and Airtel-Tigo data bundles at reseller prices in Ghana.",
      },
    ],
  }),
});

function BuyPage() {
  const navigate = useNavigate();
  const { network: initialNetwork } = Route.useSearch();
  const [activeNet, setActiveNet] = useState<Network>(initialNetwork);
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

  return (
    <>
      <NavBar />
      <WhatsAppFloat />

      <main className="pt-20 pb-24 lg:pb-10 min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8 max-w-5xl">

          {/* Back + title */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate({ to: "/" })}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All bundles</h1>
              <p className="text-xs text-gray-400">Select a network to filter</p>
            </div>
          </div>

          {/* Network tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {NETWORKS.map((n) => {
              const isActive = activeNet === n.id;
              const bg = n.id === "AT"
                ? isActive ? "linear-gradient(135deg,#E30613,#002868)" : "#f3f4f6"
                : isActive ? n.color : "#f3f4f6";
              const color = isActive
                ? n.id === "MTN" ? "#1a1200" : "#ffffff"
                : "#6b7280";
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setActiveNet(n.id);
                    navigate({ to: "/buy", search: { network: n.id } });
                  }}
                  className="rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105"
                  style={{ background: bg, color }}
                >
                  {n.label}
                </button>
              );
            })}
          </div>

          {/* Bundle grid — all bundles, no limit */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-gray-400 text-sm">No bundles available for this network yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((b) => (
                <OfferCard key={b.id} bundle={b} onBuy={onBuy} showCancelled={false} />
              ))}
            </div>
          )}
        </div>
      </main>

      <CheckoutDialog bundle={selected} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
