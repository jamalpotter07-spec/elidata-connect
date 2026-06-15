import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveBundles } from "@/lib/bundles.functions";
import { NavBar } from "@/components/nav-bar";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { OfferCard } from "@/components/offer-card";
import bgImg from "@/assets/background.jpeg";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Eli Data Resales — Cheap MTN, Telecel & AT data in Ghana" },
      {
        name: "description",
        content:
          "Buy MTN, Telecel and AT data bundles at the cheapest rates in Ghana. No sign-up needed. Track every order live, 24/7.",
      },
      { property: "og:title", content: "Eli Data Resales — Cheap data bundles, Ghana" },
    ],
  }),
});

/* ─── sheen + glass cube grid animation ─── */
const globalStyles = `
@keyframes sheen {
  0% { transform: translateX(-120%) skewX(-20deg); }
  100% { transform: translateX(220%) skewX(-20deg); }
}
.sheen-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%);
  transform: translateX(-120%) skewX(-20deg);
  animation: sheen 2.4s ease-in-out infinite;
}

/* Glass cube grid overlay */
.glass-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}
.glass-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 8px 8px;
}
`;

const NETWORKS = [
  { id: "MTN" as const,     label: "MTN",         color: "#FFCC00", textColor: "#1a1200" },
  { id: "Telecel" as const, label: "Telecel",      color: "#E30613", textColor: "#ffffff" },
  { id: "AT" as const,      label: "Airtel-Tigo",  color: "linear-gradient(135deg,#E30613,#002868)", textColor: "#ffffff" },
];

type Bundle = {
  id: string;
  network: string;
  name: string;
  data_mb: number;
  price_ghs: number;
  validity: string;
};

/* ─── Network picker modal ─── */
function NetworkPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (n: "MTN" | "Telecel" | "AT") => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      {/* Sheet */}
      <div
        className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl px-0 pb-0 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="h-1 w-10 rounded-full bg-gray-200" />
        </div>
        <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
          Select network
        </p>
        <div className="flex flex-col pb-8">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              onClick={() => onSelect(n.id)}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black shrink-0"
                style={{
                  background: n.id === "AT" ? "linear-gradient(135deg,#E30613,#002868)" : n.color,
                  color: n.textColor,
                }}
              >
                {n.id}
              </span>
              <span className="text-sm font-semibold text-gray-800">{n.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const fetchBundles = useServerFn(listActiveBundles);
  const { data, isLoading } = useQuery({
    queryKey: ["bundles"],
    queryFn: () => fetchBundles(),
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeNet, setActiveNet] = useState<"MTN" | "Telecel" | "AT">("MTN");
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const bundles = (data?.bundles ?? []) as Bundle[];

  const onBuy = (b: Bundle) => {
    setSelected(b);
    setCheckoutOpen(true);
  };

  const onNetworkSelect = (n: "MTN" | "Telecel" | "AT") => {
    setPickerOpen(false);
    navigate({ to: "/buy", search: { network: n } });
  };

  const onMoreClick = (n: "MTN" | "Telecel" | "AT") => {
    navigate({ to: "/buy", search: { network: n } });
  };

  // Top 3 per network from live Supabase data
  const top3 = (net: string) =>
    bundles.filter((b) => b.network === net).slice(0, 3);

  return (
    <>
      <style>{globalStyles}</style>
      <NavBar />
      <WhatsAppFloat />
      <NetworkPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onNetworkSelect}
      />

      <main className="pt-20 pb-24 lg:pb-10">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden" style={{ minHeight: "480px" }}>
          {/* BG image — blur reduced 40% from last (was 3px → now 1.8px) */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage: `url(${bgImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(1.8px) brightness(0.52)",
              transform: "scale(1.04)",
            }}
          />
          {/* Dark overlay */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.58) 100%)",
            }}
          />
          {/* Glass cube grid */}
          <div className="glass-grid -z-10" />

          <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-start max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl leading-tight">
              <span
                style={{
                  background: "linear-gradient(90deg, #f97316 0%, #a855f7 50%, #ffffff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Cheapest
              </span>{" "}
              <span className="text-white">Data for</span>
              <br />
              <span style={{ color: "hsl(var(--brand-orange))" }}>MTN</span>
              <span className="text-white">, </span>
              <span style={{ color: "hsl(var(--brand-orange))" }}>Telecel</span>
              <span className="text-white"> &amp; </span>
              <span style={{ color: "hsl(var(--brand-orange))" }}>AT</span>
            </h1>

            <p className="mt-5 text-base text-white/90 max-w-md leading-relaxed">
              Reseller prices, delivered to any Ghana number. Track every order live — no sign-up required.
            </p>

            <div className="mt-8">
              <button
                onClick={() => setPickerOpen(true)}
                className="sheen-btn relative overflow-hidden inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--brand-orange)) 0%, #ea580c 100%)",
                  boxShadow: "0 4px 20px rgba(249,115,22,0.45)",
                }}
              >
                Buy bundle
              </button>
            </div>
          </div>
        </section>

        {/* ── POPULAR PACKAGES ── */}
        <section id="packages" className="scroll-mt-20" style={{ background: "#ffffff" }}>
          <div className="container mx-auto px-4 py-10 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Popular packages</h2>
            <p className="text-sm text-gray-400 mb-6">Best deals across all networks.</p>

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
                    onClick={() => setActiveNet(n.id)}
                    className="rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 hover:scale-105"
                    style={{ background: bg, color }}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>

            {/* Cards row: 3 + more arrow */}
            {isLoading ? (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr) 72px" }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
                <div className="h-64 rounded-2xl bg-gray-50 animate-pulse" />
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr) 72px" }}>
                {top3(activeNet).map((b) => (
                  <OfferCard key={b.id} bundle={b} onBuy={onBuy} showCancelled />
                ))}
                {/* Pad with empties if fewer than 3 */}
                {Array.from({ length: Math.max(0, 3 - top3(activeNet).length) }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {/* More arrow */}
                <button
                  onClick={() => onMoreClick(activeNet)}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="text-2xl font-bold text-black/60">›</span>
                  <span className="text-[10px] font-semibold text-black/40 uppercase tracking-wide">More</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: "linear-gradient(135deg, hsl(var(--brand-orange)) 0%, #c2410c 100%)" }}>
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
              <div>
                <p className="text-lg font-black tracking-tight mb-1">Eli Data Resales</p>
                <p className="text-xs text-white/70 leading-relaxed max-w-[200px]">
                  Fast, reliable data bundles at reseller prices across Ghana.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Contact</p>
                <div className="flex flex-col gap-1.5 text-sm">
                  <a href="mailto:elidataresales@gmail.com" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    elidataresales@gmail.com
                  </a>
                  <a href="https://wa.me/233500843914" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    +233 500 843 914
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Legal</p>
                <div className="flex flex-col gap-1.5 text-sm">
                  <Link to="/terms" className="text-white/80 hover:text-white transition-colors">Terms of Service</Link>
                  <Link to="/privacy" className="text-white/80 hover:text-white transition-colors">Privacy Policy</Link>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    <span className="text-xs text-white/80 font-medium">Refund Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 border-t border-white/20 pt-4 flex flex-col md:flex-row items-center justify-between gap-2">
              <p className="text-xs text-white/50">© {new Date().getFullYear()} Eli Data Resales. All rights reserved.</p>
              <p className="text-xs text-white/50">Ghana 🇬🇭 · Fast · Secure · Reliable</p>
            </div>
          </div>
        </footer>
      </main>

      <CheckoutDialog bundle={selected} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
