import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveBundles } from "@/lib/bundles.functions";
import { NavBar } from "@/components/nav-bar";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { OfferCard } from "@/components/offer-card";
import bgImg from "@/assets/background.jpeg";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Eli Data Resales | Cheapest MTN, Telecel & Airtel-Tigo data in Ghana" },
      {
        name: "description",
        content:
          "Buy MTN, Telecel and Airtel-Tigo data bundles at reseller prices. No sign-up needed. Track every order live, 24/7.",
      },
      { property: "og:title", content: "Eli Data Resales | Cheapest data bundles in Ghana" },
    ],
  }),
});

const NETWORKS = [
  { id: "MTN" as const, label: "MTN" },
  { id: "Telecel" as const, label: "Telecel" },
  { id: "AT" as const, label: "Airtel-Tigo" },
];

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
  original_price_ghs?: number | null;
};

const GRID = "repeat(auto-fill, minmax(10rem, 1fr))";

function HomePage() {
  const navigate = useNavigate();
  const fetchBundles = useServerFn(listActiveBundles);
  const { data, isLoading } = useQuery({
    queryKey: ["bundles"],
    queryFn: () => fetchBundles(),
  });

  const [activeNet, setActiveNet] = useState<"MTN" | "Telecel" | "AT">("MTN");
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const bundles = (data?.bundles ?? []) as Bundle[];
  const onBuy = (b: Bundle) => {
    setSelected(b);
    setCheckoutOpen(true);
  };
  const top3 = (net: string) => bundles.filter((b) => b.network === net).slice(0, 3);

  return (
    <>
      <NavBar />
      <WhatsAppFloat />

      <main>
        {/* ── Hero ── */}
        <section
          className="relative overflow-hidden"
          style={{ minHeight: "clamp(440px, 78svh, 600px)", borderRadius: "0 0 4rem 1.25rem" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(5,8,14,0.72) 0%, rgba(5,8,14,0.62) 55%, rgba(5,8,14,0.82) 100%)",
            }}
          />

          <div
            className="relative mx-auto flex max-w-5xl flex-col justify-center px-5"
            style={{
              paddingTop: "clamp(112px, 16vw, 150px)",
              paddingBottom: "clamp(56px, 8vw, 96px)",
              animation: "slide-up 0.65s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <h1 className="hero-h1 max-w-2xl" style={{ fontSize: "clamp(2.25rem, 7vw, 3.75rem)" }}>
              <span className="word-white">Cheapest data for </span>
              <span className="word-orange">MTN</span>
              <span className="word-white">, </span>
              <span className="word-orange">Telecel</span>
              <span className="word-white"> and </span>
              <span className="word-orange">Airtel-Tigo</span>
            </h1>

            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/85">
              Reseller prices, delivered to any Ghana number. No sign-up needed.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button className="btn-orange" onClick={() => navigate({ to: "/buy" })}>
                Buy bundle now
              </button>
              <Link to="/track" className="btn-white-ghost">
                Track order
              </Link>
            </div>
          </div>
        </section>

        {/* ── Intro paragraph (replaces the banner and the four cards) ── */}
        <section className="mx-auto max-w-3xl px-5 pt-12">
          <p className="text-lg leading-8 text-muted-foreground">
            Pay with Mobile Money or card and your data is sent automatically, usually within a minute, day or
            night. If a delivery fails, you get a full refund.{" "}
            <Link to="/about" hash="refunds" className="font-semibold text-foreground underline underline-offset-4">
              How refunds work
            </Link>
          </p>
        </section>

        {/* ── Popular packages ── */}
        <section id="packages" className="scroll-mt-24 px-4 pb-16 pt-12">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-semibold md:text-3xl">Popular packages</h2>

            <div className="network-strip mt-5 max-w-full overflow-x-auto" role="tablist" aria-label="Select network">
              {NETWORKS.map((n) => (
                <button
                  key={n.id}
                  role="tab"
                  aria-selected={activeNet === n.id}
                  className={`network-tab${activeNet === n.id ? " active" : ""}`}
                  onClick={() => setActiveNet(n.id)}
                >
                  {n.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: GRID }}>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="h-52 animate-pulse bg-muted"
                    style={{ borderRadius: "1.75rem 0.75rem 1.75rem 0.75rem" }}
                  />
                ))
              ) : (
                <>
                  {top3(activeNet).map((b, i) => (
                    <div
                      key={b.id}
                      style={{ animation: `scale-in 0.38s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s both` }}
                    >
                      <OfferCard bundle={b} onBuy={onBuy} showCancelled />
                    </div>
                  ))}

                  <button
                    onClick={() => navigate({ to: "/buy", search: { network: activeNet } })}
                    className="bundle-card items-center justify-center gap-2 border-dashed bg-transparent text-primary"
                    style={{ background: "transparent" }}
                    aria-label="See all bundles"
                  >
                    <ChevronRight className="h-7 w-7" strokeWidth={2.5} />
                    <span className="font-heading text-base font-semibold">See all</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-border bg-card">
          <div className="mx-auto max-w-5xl px-5 pb-32 pt-10 lg:pb-10">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <p className="font-display text-xl font-semibold text-foreground">Eli Data Resales</p>
                <p className="mt-2 max-w-xs text-base leading-relaxed text-muted-foreground">
                  Fast, reliable data bundles at reseller prices across Ghana.
                </p>
              </div>

              <div>
                <p className="text-base font-semibold text-foreground">Contact</p>
                <div className="mt-3 flex flex-col gap-1">
                  <a
                    href="mailto:elidataresales@gmail.com"
                    className="inline-flex min-h-11 items-center text-base text-muted-foreground transition-colors hover:text-foreground"
                  >
                    elidataresales@gmail.com
                  </a>
                  <a
                    href="https://wa.me/233500843914"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center text-base text-muted-foreground transition-colors hover:text-foreground"
                  >
                    WhatsApp +233 500 843 914
                  </a>
                </div>
              </div>

              <div>
                <p className="text-base font-semibold text-foreground">Legal</p>
                <div className="mt-3 flex flex-col gap-1">
                  <Link
                    to="/terms"
                    className="inline-flex min-h-11 items-center text-base text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Terms of service
                  </Link>
                  <Link
                    to="/privacy"
                    className="inline-flex min-h-11 items-center text-base text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Privacy policy
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Eli Data Resales. All rights reserved.
            </p>
          </div>
        </footer>
      </main>

      <CheckoutDialog bundle={selected} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
