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
import { Shield, Clock, Wifi, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Eli Data Resales — Cheapest MTN, Telecel & Airtel-Tigo data in Ghana" },
      {
        name: "description",
        content:
          "Buy MTN, Telecel and Airtel-Tigo data bundles at reseller prices. No sign-up needed. Track every order live, 24/7.",
      },
      { property: "og:title", content: "Eli Data Resales — Cheapest data bundles, Ghana" },
    ],
  }),
});

const NETWORKS = [
  { id: "MTN"     as const, label: "MTN"         },
  { id: "Telecel" as const, label: "Telecel"      },
  { id: "AT"      as const, label: "Airtel-Tigo"  },
];

const TRUST_BADGES = [
  {
    icon: "⚡",
    label: "Instant Delivery",
    sub: "Most orders in under 60s",
  },
  {
    icon: Shield,
    label: "Refund Guarantee",
    sub: "100% money-back promise",
  },
  {
    icon: Clock,
    label: "24/7 Available",
    sub: "Order anytime, day or night",
  },
  {
    icon: Wifi,
    label: "All Networks",
    sub: "MTN, Telecel & Airtel-Tigo",
  },
];

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
  original_price_ghs?: number | null;
};

function HomePage() {
  const navigate        = useNavigate();
  const fetchBundles    = useServerFn(listActiveBundles);
  const { data, isLoading } = useQuery({
    queryKey: ["bundles"],
    queryFn: () => fetchBundles(),
  });

  const [activeNet,     setActiveNet]     = useState<"MTN" | "Telecel" | "AT">("MTN");
  const [selected,      setSelected]      = useState<Bundle | null>(null);
  const [checkoutOpen,  setCheckoutOpen]  = useState(false);

  const bundles = (data?.bundles ?? []) as Bundle[];
  const onBuy   = (b: Bundle) => { setSelected(b); setCheckoutOpen(true); };
  const top3    = (net: string) => bundles.filter((b) => b.network === net).slice(0, 3);

  return (
    <>
      <NavBar />
      <WhatsAppFloat />

      <main style={{ paddingBottom: "80px" }}>

        {/* ════════════════════════════════════
            HERO
        ════════════════════════════════════ */}
        <section
          className="relative overflow-hidden"
          style={{ minHeight: "clamp(480px, 90svh, 640px)" }}
        >
          {/* Background image — tiny blur, properly positioned */}
          <div
            aria-hidden="true"
            style={{
              position:           "absolute",
              inset:              0,
              backgroundImage:    `url(${bgImg})`,
              backgroundSize:     "cover",
              backgroundPosition: "center 30%",
              filter:             "blur(1.5px) brightness(0.42)",
              transform:          "scale(1.04)",
              zIndex:             0,
            }}
          />
          {/* Dark overlay for readability */}
          <div
            aria-hidden="true"
            style={{
              position:   "absolute",
              inset:      0,
              background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.65) 100%)",
              zIndex:     1,
            }}
          />

          {/* Content */}
          <div
            className="relative flex flex-col justify-center px-5 py-16 md:py-24 max-w-2xl mx-auto"
            style={{ zIndex: 2, animation: "slide-up 0.65s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            {/* Network strip above headline */}
            <p
              style={{
                fontFamily:    "var(--font-eyebrow)",
                fontSize:      "0.78rem",
                letterSpacing: "0.12em",
                color:         "rgba(255,255,255,0.75)",
                marginBottom:  "14px",
              }}
            >
              MTN&nbsp;·&nbsp;Telecel&nbsp;·&nbsp;Airtel-Tigo
            </p>

            {/* H1 */}
            <h1
              className="hero-h1"
              style={{ fontSize: "clamp(2.2rem, 7vw, 3.6rem)" }}
            >
              <span className="word-white">Cheapest Data for </span>
              <span className="word-orange">MTN</span>
              <span className="word-white">, </span>
              <span className="word-orange">Telecel</span>
              <span className="word-white"> &amp; </span>
              <span className="word-orange">Airtel-Tigo</span>
            </h1>

            {/* Sub */}
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize:   "clamp(0.88rem, 2.5vw, 1rem)",
                color:      "rgba(255,255,255,0.80)",
                marginTop:  "16px",
                lineHeight: 1.65,
                maxWidth:   "44ch",
              }}
            >
              Reseller prices delivered to any Ghana number.
              Track every order live — no sign-up required.
            </p>

            {/* CTA row */}
            <div
              className="flex flex-wrap gap-3"
              style={{ marginTop: "28px" }}
            >
              <button
                className="btn-orange"
                onClick={() => navigate({ to: "/buy" })}
                style={{
                  padding:    "13px 28px",
                  fontSize:   "0.9rem",
                }}
              >
                Buy bundle now
              </button>

              <Link
                to="/track"
                className="btn-white-ghost inline-flex items-center gap-1.5"
                style={{
                  padding:  "12px 22px",
                  fontSize: "0.9rem",
                }}
              >
                Track order
                <ChevronRight
                  style={{
                    width: "16px", height: "16px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.18)",
                    padding: "1px",
                  }}
                />
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            FEATURE CARDS
        ════════════════════════════════════ */}
        <section style={{ background: "var(--background)", padding: "48px 0 0" }}>
          <div className="mx-auto px-4 max-w-5xl">

            {/* Eyebrow */}
            <p className="eyebrow mb-6">We offer</p>

            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))" }}
            >
              {TRUST_BADGES.map(({ icon: Icon, label, sub }, i) => (
                <div
                  key={label}
                  className="feature-card flex flex-col items-center text-center gap-3 px-4 py-5"
                  style={{
                    animation: `scale-in 0.45s cubic-bezier(0.22,1,0.36,1) ${i * 0.07}s both`,
                  }}
                >
                  <span
                    className="feature-icon flex items-center justify-center rounded-2xl"
                    style={{
                      width:       "44px",
                      height:      "44px",
                      background:  "rgba(230,81,0,0.08)",
                      border:      "1.5px solid rgba(230,81,0,0.15)",
                      transition:  "background 0.28s, border-color 0.28s",
                    }}
                  >
                    {typeof Icon === "string" ? (
                      <span style={{ fontSize: "1.2rem" }}>{Icon}</span>
                    ) : (
                      <Icon
                        style={{ width: "18px", height: "18px", color: "#e65100" }}
                        strokeWidth={2}
                      />
                    )}
                  </span>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                        fontSize:   "0.82rem",
                        color:      "var(--foreground)",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize:   "0.72rem",
                        color:      "var(--muted-foreground)",
                        marginTop:  "3px",
                        lineHeight: 1.45,
                      }}
                    >
                      {sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            POPULAR PACKAGES
        ════════════════════════════════════ */}
        <section
          id="packages"
          className="scroll-mt-20"
          style={{ background: "var(--background)", padding: "44px 0 56px" }}
        >
          <div className="mx-auto px-4 max-w-5xl">

            {/* Heading */}
            <div style={{ marginBottom: "24px" }}>
              <h2
                className="section-h2 text-gradient-gold"
                style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)" }}
              >
                Popular packages
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize:   "0.82rem",
                  color:      "var(--muted-foreground)",
                  marginTop:  "4px",
                }}
              >
                Best deals across all networks.
              </p>
            </div>

            {/* Network selector — connected pill strip */}
            <div style={{ marginBottom: "24px" }}>
              <div className="network-strip">
                {NETWORKS.map((n) => (
                  <button
                    key={n.id}
                    className={`network-tab${activeNet === n.id ? " active" : ""}`}
                    onClick={() => setActiveNet(n.id)}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards grid */}
            {isLoading ? (
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(148px, 180px))" }}
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-3xl"
                    style={{
                      background:  "rgba(0,0,0,0.06)",
                      aspectRatio: "3/4",
                      maxWidth:    "180px",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(148px, 180px))" }}
              >
                {top3(activeNet).map((b, i) => (
                  <div
                    key={b.id}
                    style={{
                      animation: `scale-in 0.38s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s both`,
                    }}
                  >
                    <OfferCard bundle={b} onBuy={onBuy} showCancelled />
                  </div>
                ))}

                {/* "More" card */}
                <button
                  onClick={() => navigate({ to: "/buy", search: { network: activeNet } })}
                  className="bundle-card flex flex-col items-center justify-center gap-2"
                  style={{
                    background:  "rgba(0,0,0,0.03)",
                    border:      "1.5px dashed rgba(0,0,0,0.15)",
                    color:       "#555555",
                    maxWidth:    "180px",
                  }}
                  aria-label="See all bundles"
                >
                  <ChevronRight
                    style={{ width: "24px", height: "24px", color: "#e65100" }}
                    strokeWidth={2.5}
                  />
                  <span
                    style={{
                      fontFamily:    "var(--font-heading)",
                      fontWeight:    700,
                      fontSize:      "0.7rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color:         "#e65100",
                    }}
                  >
                    See all
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════
            FOOTER
        ════════════════════════════════════ */}
        <footer className="site-footer">
          <div className="mx-auto px-5 py-10 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Brand */}
              <div>
                <p
                  style={{
                    fontFamily:    "var(--font-hero)",
                    fontWeight:    900,
                    fontSize:      "1.15rem",
                    color:         "#ffffff",
                    letterSpacing: "-0.01em",
                    marginBottom:  "8px",
                  }}
                >
                  Eli Data Resales
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize:   "0.78rem",
                    color:      "rgba(255,255,255,0.70)",
                    lineHeight: 1.6,
                    maxWidth:   "200px",
                  }}
                >
                  Fast, reliable data bundles at reseller prices across Ghana.
                </p>
              </div>

              {/* Contact */}
              <div>
                <p
                  style={{
                    fontFamily:    "var(--font-eyebrow)",
                    fontSize:      "0.68rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color:         "rgba(255,255,255,0.50)",
                    marginBottom:  "16px",
                  }}
                >
                  Contact
                </p>
                <div className="flex flex-col gap-3">
                  <a
                    href="mailto:elidataresales@gmail.com"
                    className="flex items-center gap-2 transition-opacity hover:opacity-80"
                    style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}
                  >
                    <svg className="shrink-0" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    elidataresales@gmail.com
                  </a>
                  <a
                    href="https://wa.me/233500843914"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 transition-opacity hover:opacity-80"
                    style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}
                  >
                    <svg className="shrink-0" width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    +233 500 843 914
                  </a>
                </div>
              </div>

              {/* Legal */}
              <div>
                <p
                  style={{
                    fontFamily:    "var(--font-eyebrow)",
                    fontSize:      "0.68rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color:         "rgba(255,255,255,0.50)",
                    marginBottom:  "16px",
                  }}
                >
                  Legal
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    to="/terms"
                    style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}
                    className="transition-opacity hover:opacity-80"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    to="/privacy"
                    style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "rgba(255,255,255,0.85)" }}
                    className="transition-opacity hover:opacity-80"
                  >
                    Privacy Policy
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: "22px", height: "22px",
                        background: "rgba(255,255,255,0.15)",
                      }}
                    >
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize:   "0.75rem",
                        color:      "rgba(255,255,255,0.75)",
                        fontWeight: 500,
                      }}
                    >
                      Refund Guarantee
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div
              className="flex flex-col md:flex-row items-center justify-between gap-2"
              style={{
                marginTop:   "32px",
                paddingTop:  "20px",
                borderTop:   "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(255,255,255,0.50)" }}>
                © {new Date().getFullYear()} Eli Data Resales. All rights reserved.
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "rgba(255,255,255,0.50)" }}>
                Ghana 🇬🇭 · Fast · Secure · Reliable
              </p>
            </div>
          </div>
        </footer>
      </main>

      <CheckoutDialog bundle={selected} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
