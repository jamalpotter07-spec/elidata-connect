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
import { Zap, Shield, Clock, ArrowRight, Wifi } from "lucide-react";

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

const NETWORKS = [
  { id: "MTN" as const,     label: "MTN",        color: "#FFCC00", textColor: "#1a1200" },
  { id: "Telecel" as const, label: "Telecel",     color: "#E30613", textColor: "#ffffff" },
  { id: "AT" as const,      label: "Airtel-Tigo", color: "linear-gradient(135deg,#E30613,#002868)", textColor: "#ffffff" },
];

const TRUST_BADGES = [
  { icon: Zap,    label: "Instant Delivery",  sub: "Most orders in under 60s" },
  { icon: Shield, label: "Refund Guarantee",  sub: "100% money-back promise" },
  { icon: Clock,  label: "24/7 Available",    sub: "Order anytime, day or night" },
  { icon: Wifi,   label: "All Networks",      sub: "MTN, Telecel & Airtel-Tigo" },
];

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
};

/* ── Network picker modal ── */
function NetworkPickerModal({
  open, onClose, onSelect,
}: {
  open: boolean; onClose: () => void;
  onSelect: (n: "MTN" | "Telecel" | "AT") => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl pb-0 overflow-hidden"
        style={{
          background: "rgba(13, 17, 23, 0.92)",
          backdropFilter: "blur(32px)",
          border: "1px solid rgba(0,255,255,0.12)",
          boxShadow: "0 -8px 64px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-4 pb-3">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>
        <p className="text-center text-xs font-bold text-white/40 uppercase tracking-[0.18em] mb-5">
          Select network
        </p>
        <div className="flex flex-col pb-8">
          {NETWORKS.map((n) => (
            <button
              key={n.id}
              onClick={() => onSelect(n.id)}
              className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/05 active:bg-white/10"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black shrink-0"
                style={{
                  background: n.id === "AT" ? "linear-gradient(135deg,#E30613,#002868)" : n.color,
                  color: n.textColor,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.30)",
                }}
              >
                {n.id}
              </span>
              <span className="text-sm font-semibold text-white/85">{n.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-white/30" />
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

  const [pickerOpen, setPickerOpen]     = useState(false);
  const [activeNet, setActiveNet]       = useState<"MTN" | "Telecel" | "AT">("MTN");
  const [selected, setSelected]         = useState<Bundle | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const bundles = (data?.bundles ?? []) as Bundle[];
  const onBuy = (b: Bundle) => { setSelected(b); setCheckoutOpen(true); };
  const onNetworkSelect = (n: "MTN" | "Telecel" | "AT") => {
    setPickerOpen(false);
    navigate({ to: "/buy", search: { network: n } });
  };
  const onMoreClick = (n: "MTN" | "Telecel" | "AT") =>
    navigate({ to: "/buy", search: { network: n } });
  const top3 = (net: string) => bundles.filter((b) => b.network === net).slice(0, 3);

  return (
    <>
      <NavBar />
      <WhatsAppFloat />
      <NetworkPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onNetworkSelect}
      />

      <main className="pt-20 pb-24 lg:pb-10">

        {/* ══════════════════════════════════════════
            HERO — Ocean Depths × Tech Innovation
        ══════════════════════════════════════════ */}
        <section className="relative overflow-hidden" style={{ minHeight: "520px" }}>
          {/* BG image */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage: `url(${bgImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(2px) brightness(0.38)",
              transform: "scale(1.05)",
            }}
          />
          {/* Deep navy overlay — Ocean Depths */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: "linear-gradient(160deg, rgba(26,35,50,0.82) 0%, rgba(0,10,30,0.75) 50%, rgba(0,102,255,0.18) 100%)",
            }}
          />
          {/* Glass grid — Tech Innovation */}
          <div className="glass-grid -z-10" />

          {/* Aurora blobs */}
          <div className="aurora-blob" style={{ width: 420, height: 420, background: "rgba(0,102,255,0.30)", top: -80, right: "10%" }} />
          <div className="aurora-blob" style={{ width: 320, height: 320, background: "rgba(0,255,255,0.18)", bottom: -40, left: "5%", animationDelay: "-7s" }} />

          <div
            className="container mx-auto px-4 py-20 md:py-28 flex flex-col items-start max-w-2xl"
            style={{ animation: "slide-up 0.7s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            {/* Eyebrow */}
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-[0.14em] uppercase mb-6"
              style={{
                background: "rgba(0,255,255,0.10)",
                border: "1px solid rgba(0,255,255,0.20)",
                color: "#00ffff",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              Ghana's #1 Data Reseller
            </span>

            <h1
              className="text-4xl font-extrabold tracking-tight md:text-6xl leading-[1.05]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="text-gradient-hero">Cheapest Data</span>
              <br />
              <span className="text-white">for MTN, Telecel</span>
              <br />
              <span className="text-white">&amp; </span>
              <span className="text-gradient-ocean">Airtel-Tigo</span>
            </h1>

            <p className="mt-5 text-base text-white/75 max-w-md leading-relaxed">
              Reseller prices delivered to any Ghana number.
              Track every order live — no sign-up required.
            </p>

            <div className="mt-9 flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setPickerOpen(true)}
                className="sheen-btn btn-electric relative overflow-hidden inline-flex items-center gap-2 justify-center rounded-full px-8 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                style={{ borderRadius: "9999px" }}
              >
                <Zap className="h-4 w-4" />
                Buy bundle now
              </button>
              <Link
                to="/track"
                className="btn-ghost-glass inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                Track order
                <ArrowRight className="h-4 w-4 opacity-60" />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TRUST BADGES — glass cards
        ══════════════════════════════════════════ */}
        <section style={{ background: "var(--color-background)" }}>
          <div className="container mx-auto px-4 py-10 max-w-5xl">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {TRUST_BADGES.map(({ icon: Icon, label, sub }, i) => (
                <div
                  key={label}
                  className="ocean-card flex flex-col items-center text-center gap-3 px-4 py-5"
                  style={{ animation: `scale-in 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.07}s both` }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,102,255,0.12), rgba(0,255,255,0.08))",
                      border: "1px solid rgba(0,255,255,0.15)",
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#0066ff" }} strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            POPULAR PACKAGES
        ══════════════════════════════════════════ */}
        <section
          id="packages"
          className="scroll-mt-20"
          style={{ background: "var(--color-background)" }}
        >
          <div className="container mx-auto px-4 pb-12 max-w-5xl">

            <div className="flex items-end justify-between mb-2">
              <div>
                <h2
                  className="text-2xl md:text-3xl font-bold"
                  style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
                >
                  Popular packages
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Best deals across all networks.</p>
              </div>
            </div>

            {/* Network tabs */}
            <div className="flex gap-2 my-5 flex-wrap">
              {NETWORKS.map((n) => {
                const isActive = activeNet === n.id;
                const bg = n.id === "AT"
                  ? isActive ? "linear-gradient(135deg,#E30613,#002868)" : "rgba(0,102,255,0.06)"
                  : isActive ? n.color : "rgba(0,102,255,0.06)";
                const color = isActive
                  ? n.id === "MTN" ? "#1a1200" : "#ffffff"
                  : "var(--color-muted-foreground)";
                const borderColor = isActive
                  ? "transparent"
                  : "rgba(0,102,255,0.12)";
                return (
                  <button
                    key={n.id}
                    onClick={() => setActiveNet(n.id)}
                    className="rounded-full px-5 py-2 text-sm font-semibold transition-all duration-250 hover:scale-[1.04]"
                    style={{
                      background: bg, color,
                      border: `1px solid ${borderColor}`,
                      boxShadow: isActive ? "0 4px 16px rgba(0,0,0,0.18)" : "none",
                    }}
                  >
                    {n.label}
                  </button>
                );
              })}
            </div>

            {/* Cards */}
            {isLoading ? (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr) 72px" }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-3xl animate-pulse" style={{ background: "rgba(0,102,255,0.06)" }} />
                ))}
                <div className="h-64 rounded-3xl animate-pulse" style={{ background: "rgba(0,102,255,0.04)" }} />
              </div>
            ) : (
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr) 72px" }}>
                {top3(activeNet).map((b, i) => (
                  <div
                    key={b.id}
                    style={{ animation: `scale-in 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s both` }}
                  >
                    <OfferCard bundle={b} onBuy={onBuy} showCancelled />
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - top3(activeNet).length) }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {/* More arrow */}
                <button
                  onClick={() => onMoreClick(activeNet)}
                  className="flex flex-col items-center justify-center gap-2 rounded-3xl transition-all hover:scale-[1.04] active:scale-[0.97]"
                  style={{
                    background: "rgba(0,102,255,0.06)",
                    border: "1px solid rgba(0,102,255,0.10)",
                  }}
                >
                  <ArrowRight className="h-5 w-5" style={{ color: "#0066ff" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#0066ff" }}>More</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FOOTER — deep navy Ocean Depths
        ══════════════════════════════════════════ */}
        <footer style={{ background: "linear-gradient(135deg, #0a1628 0%, #1a2332 100%)" }}>
          {/* Gradient border top */}
          <div className="gradient-border-top h-px w-full" />
          <div className="container mx-auto px-4 py-10 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
              <div>
                <p className="text-lg font-black tracking-tight mb-2 text-gradient-ocean" style={{ fontFamily: "var(--font-display)" }}>
                  Eli Data Resales
                </p>
                <p className="text-xs text-white/50 leading-relaxed max-w-[200px]">
                  Fast, reliable data bundles at reseller prices across Ghana.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Contact</p>
                <div className="flex flex-col gap-2.5 text-sm">
                  <a href="mailto:elidataresales@gmail.com"
                    className="flex items-center gap-2 text-white/65 hover:text-white transition-colors"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    elidataresales@gmail.com
                  </a>
                  <a href="https://wa.me/233500843914" target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-white/65 hover:text-white transition-colors"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    +233 500 843 914
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/35 mb-4">Legal</p>
                <div className="flex flex-col gap-2.5 text-sm">
                  <Link to="/terms" className="text-white/65 hover:text-white transition-colors">Terms of Service</Link>
                  <Link to="/privacy" className="text-white/65 hover:text-white transition-colors">Privacy Policy</Link>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "rgba(0,255,255,0.12)", border: "1px solid rgba(0,255,255,0.20)" }}>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: "#00ffff" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    <span className="text-xs text-white/60 font-medium">Refund Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-white/10 pt-5 flex flex-col md:flex-row items-center justify-between gap-2">
              <p className="text-xs text-white/35">© {new Date().getFullYear()} Eli Data Resales. All rights reserved.</p>
              <p className="text-xs text-white/35">Ghana 🇬🇭 · Fast · Secure · Reliable</p>
            </div>
          </div>
        </footer>
      </main>

      <CheckoutDialog bundle={selected} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
