import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { NavBar } from "@/components/nav-bar";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import bgImg from "@/assets/background.jpg";

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

/* ─────────────────────────────────────────────────────
   STATIC OFFER DATA
───────────────────────────────────────────────────── */
type Offer = {
  id: string;
  network: "MTN" | "Telecel" | "AT";
  dataLabel: string;
  dataNum: string;
  validity: string;
  cancelled: string;
  price: string;
};

const ALL_OFFERS: Offer[] = [
  // MTN
  { id: "mtn-1", network: "MTN", dataNum: "1", dataLabel: "GB", validity: "30 days", cancelled: "4.90", price: "4.33" },
  { id: "mtn-5", network: "MTN", dataNum: "5", dataLabel: "GB", validity: "30 days", cancelled: "22.00", price: "21.65" },
  { id: "mtn-50", network: "MTN", dataNum: "50", dataLabel: "GB", validity: "30 days", cancelled: "215.60", price: "213.12" },
  // Telecel
  { id: "tel-10", network: "Telecel", dataNum: "10", dataLabel: "GB", validity: "30 days", cancelled: "43.00", price: "42.18" },
  { id: "tel-15", network: "Telecel", dataNum: "15", dataLabel: "GB", validity: "30 days", cancelled: "61.86", price: "61.05" },
  { id: "tel-50", network: "Telecel", dataNum: "50", dataLabel: "GB", validity: "30 days", cancelled: "200.75", price: "199.80" },
  // Airtel-Tigo
  { id: "at-1", network: "AT", dataNum: "1", dataLabel: "GB", validity: "30 days", cancelled: "4.55", price: "4.16" },
  { id: "at-5", network: "AT", dataNum: "5", dataLabel: "GB", validity: "30 days", cancelled: "20.99", price: "20.54" },
  { id: "at-30", network: "AT", dataNum: "30", dataLabel: "GB", validity: "30 days", cancelled: "125.00", price: "123.21" },
];

const NETWORKS: { id: "MTN" | "Telecel" | "AT"; label: string; color: string; textColor: string }[] = [
  { id: "MTN", label: "MTN", color: "#FFCC00", textColor: "#1a1200" },
  { id: "Telecel", label: "Telecel", color: "#E30613", textColor: "#ffffff" },
  { id: "AT", label: "Airtel-Tigo", color: "linear-gradient(135deg,#E30613,#002868)", textColor: "#ffffff" },
];

/* ─────────────────────────────────────────────────────
   SHEEN ANIMATION — injected once
───────────────────────────────────────────────────── */
const sheenStyle = `
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
@keyframes card-sheen {
  0% { transform: translateX(-160%) skewX(-20deg); }
  100% { transform: translateX(260%) skewX(-20deg); }
}
.sheen-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
  transform: translateX(-160%) skewX(-20deg);
  animation: card-sheen 3.5s ease-in-out infinite;
  pointer-events: none;
}
`;

/* ─────────────────────────────────────────────────────
   OFFER CARD
───────────────────────────────────────────────────── */
function OfferCard({ offer, onBuy }: { offer: Offer; onBuy: (o: Offer) => void }) {
  const net = NETWORKS.find((n) => n.id === offer.network)!;

  // Network logo area bg
  const topBg =
    offer.network === "MTN"
      ? "linear-gradient(135deg, #FFCC00 0%, #ffb800 100%)"
      : offer.network === "Telecel"
      ? "linear-gradient(135deg, #E30613 0%, #b00010 100%)"
      : "linear-gradient(135deg, #E30613 0%, #002868 100%)";

  // validity badge
  const validityShort = offer.validity.replace(" days", "d");

  return (
    <div
      className="relative overflow-hidden rounded-2xl sheen-card flex flex-col"
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        minHeight: "220px",
      }}
    >
      {/* TOP 45% — network colour block */}
      <div
        className="relative flex items-center justify-center"
        style={{ background: topBg, height: "45%" }}
      >
        {/* Network name as logo placeholder */}
        <span
          className="text-2xl font-black tracking-tight"
          style={{ color: net.textColor, opacity: 0.9 }}
        >
          {net.label}
        </span>

        {/* Validity badge — top right, rotated */}
        <span
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-bold text-white leading-tight text-center"
          style={{
            background: "rgba(0,0,0,0.75)",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
            fontSize: "8px",
          }}
        >
          {validityShort}
        </span>
      </div>

      {/* DATA SIZE — straddles the dividing line */}
      <div
        className="absolute left-0 right-0 flex items-baseline justify-center"
        style={{ top: "calc(45% - 22px)" }}
      >
        <span
          className="font-black text-white leading-none"
          style={{ fontSize: "clamp(36px, 10vw, 52px)", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
        >
          {offer.dataNum}
        </span>
        <span
          className="font-bold text-white/80 ml-0.5"
          style={{ fontSize: "11px", marginBottom: "2px" }}
        >
          GB
        </span>
      </div>

      {/* BOTTOM HALF — pricing + buy */}
      <div className="flex flex-col justify-end flex-1 px-3 pb-3 pt-6">
        {/* Cancelled + real price */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">Price</span>
            <span className="text-[11px] text-white/40 line-through">GHS {offer.cancelled}</span>
            <span className="text-[15px] font-bold text-white">GHS {offer.price}</span>
          </div>

          {/* Buy button */}
          <button
            onClick={() => onBuy(offer)}
            className="relative overflow-hidden rounded-full px-4 py-1.5 text-xs font-bold text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: "#111827", minWidth: "56px" }}
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MORE ARROW CARD
───────────────────────────────────────────────────── */
function MoreCard({ network }: { network: "MTN" | "Telecel" | "AT" }) {
  const label = network === "AT" ? "airtel-tigo" : network.toLowerCase();
  return (
    <Link
      to={`/buy`}
      className="relative overflow-hidden rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
      style={{
        background: "rgba(0,0,0,0.04)",
        border: "1.5px solid rgba(0,0,0,0.10)",
        minHeight: "220px",
        minWidth: "80px",
      }}
    >
      <span className="text-3xl font-bold text-black/70">›</span>
      <span className="text-[10px] font-semibold text-black/50 uppercase tracking-wide">More</span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────
   HOMEPAGE
───────────────────────────────────────────────────── */
function HomePage() {
  const [activeNet, setActiveNet] = useState<"MTN" | "Telecel" | "AT">("MTN");
  const [selected, setSelected] = useState<Offer | null>(null);
  const [open, setOpen] = useState(false);

  const visibleOffers = ALL_OFFERS.filter((o) => o.network === activeNet);

  const onBuy = (o: Offer) => {
    setSelected(o);
    setOpen(true);
  };

  return (
    <>
      <style>{sheenStyle}</style>
      <NavBar />
      <WhatsAppFloat />

      <main className="pt-20 pb-24 lg:pb-10">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden" style={{ minHeight: "480px" }}>
          {/* Background image with blur */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage: `url(${bgImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(3px) brightness(0.55)",
              transform: "scale(1.05)",
            }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%)",
            }}
          />

          <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-start max-w-2xl">
            {/* Headline */}
            <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl leading-tight">
              {/* "Cheapest" gradient */}
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
              {/* Networks */}
              <span style={{ color: "hsl(var(--brand-orange))" }}>MTN</span>
              <span className="text-white">, </span>
              <span style={{ color: "hsl(var(--brand-orange))" }}>Telecel</span>
              <span className="text-white"> </span>
              <span className="text-white">&amp; </span>
              <span style={{ color: "hsl(var(--brand-orange))" }}>AT</span>
            </h1>

            {/* Subtext */}
            <p className="mt-5 text-base text-white/90 max-w-md leading-relaxed">
              Reseller prices, delivered to any Ghana number. Track every order live — no sign-up required.
            </p>

            {/* CTA */}
            <div className="mt-8">
              <a
                href="#packages"
                className="sheen-btn relative overflow-hidden inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--brand-orange)) 0%, #ea580c 100%)",
                  boxShadow: "0 4px 20px rgba(249,115,22,0.45)",
                }}
              >
                Buy bundle
              </a>
            </div>
          </div>
        </section>

        {/* ── PACKAGES BODY ── */}
        <section
          id="packages"
          className="scroll-mt-20"
          style={{ background: "#ffffff" }}
        >
          <div className="container mx-auto px-4 py-10 max-w-5xl">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Popular packages</h2>
            <p className="text-sm text-gray-400 mb-6">Best deals across all networks.</p>

            {/* Network selector tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {NETWORKS.map((n) => {
                const isActive = activeNet === n.id;
                const bg =
                  n.id === "AT"
                    ? isActive
                      ? "linear-gradient(135deg,#E30613,#002868)"
                      : "#f3f4f6"
                    : isActive
                    ? n.color
                    : "#f3f4f6";
                const color = isActive
                  ? n.id === "MTN"
                    ? "#1a1200"
                    : "#ffffff"
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

            {/* Cards grid: 3 offers + more arrow */}
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr) 80px" }}>
              {visibleOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onBuy={onBuy} />
              ))}
              <MoreCard network={activeNet} />
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer
          style={{
            background: "linear-gradient(135deg, hsl(var(--brand-orange)) 0%, #c2410c 100%)",
          }}
        >
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">

              {/* Col 1 — Brand */}
              <div>
                <p className="text-lg font-black tracking-tight mb-1">Eli Data Resales</p>
                <p className="text-xs text-white/70 leading-relaxed max-w-[200px]">
                  Fast, reliable data bundles at reseller prices across Ghana.
                </p>
              </div>

              {/* Col 2 — Contact */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">Contact</p>
                <div className="flex flex-col gap-1.5 text-sm">
                  <a
                    href="mailto:elidataresales@gmail.com"
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    elidataresales@gmail.com
                  </a>
                  <a
                    href="https://wa.me/233500843914"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    +233 500 843 914
                  </a>
                </div>
              </div>

              {/* Col 3 — Legal + guarantee */}
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

            {/* Bottom bar */}
            <div className="mt-6 border-t border-white/20 pt-4 flex flex-col md:flex-row items-center justify-between gap-2">
              <p className="text-xs text-white/50">© {new Date().getFullYear()} Eli Data Resales. All rights reserved.</p>
              <p className="text-xs text-white/50">Ghana 🇬🇭 · Fast · Secure · Reliable</p>
            </div>
          </div>
        </footer>
      </main>

      {/* Checkout dialog — receives static offer shaped as Bundle */}
      <CheckoutDialog
        bundle={
          selected
            ? {
                id: selected.id,
                network: selected.network,
                name: `${selected.dataNum}${selected.dataLabel}`,
                data_mb: parseFloat(selected.dataNum) * 1024,
                price_ghs: parseFloat(selected.price),
                validity: selected.validity,
              }
            : null
        }
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
