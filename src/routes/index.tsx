import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveBundles } from "@/lib/bundles.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Zap, ShieldCheck, ArrowRight, Wifi } from "lucide-react";
import { NavBar } from "@/components/nav-bar";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { NetworkBadge } from "@/components/status-badge";
import { LiveClock } from "@/components/live-clock";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "DataPlug GH — Cheap MTN, Telecel & AT data bundles" },
      {
        name: "description",
        content:
          "Buy MTN, Telecel and AT data bundles at the cheapest rates in Ghana. No sign-up needed. Instant delivery 24/7.",
      },
      { property: "og:title", content: "DataPlug GH — Cheap data bundles" },
    ],
  }),
});

type Bundle = {
  id: string;
  network: string;
  name: string;
  data_mb: number;
  price_ghs: number;
  validity: string;
};

function HomePage() {
  const fetchBundles = useServerFn(listActiveBundles);
  const { data, isLoading } = useQuery({
    queryKey: ["bundles"],
    queryFn: () => fetchBundles(),
  });
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [open, setOpen] = useState(false);
  const bundles = (data?.bundles ?? []) as Bundle[];
  const networks: Array<"MTN" | "Telecel" | "AT"> = ["MTN", "Telecel", "AT"];

  const onBuy = (b: Bundle) => {
    setSelected(b);
    setOpen(true);
  };

  return (
    <>
      <NavBar />
      <main className="pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <div
            className="absolute inset-0 -z-10 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, hsl(var(--brand-navy)) 0, transparent 40%), radial-gradient(circle at 80% 60%, hsl(var(--brand-orange)) 0, transparent 40%)",
            }}
          />
          <div className="container mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium">
                <Wifi className="h-3 w-3 text-[hsl(var(--brand-orange))]" />
                Trusted by thousands of Ghanaians
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">
                Cheapest data for{" "}
                <span style={{ color: "hsl(var(--brand-orange))" }}>MTN</span>,{" "}
                <span style={{ color: "hsl(var(--brand-orange))" }}>Telecel</span> &{" "}
                <span style={{ color: "hsl(var(--brand-orange))" }}>AT</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-lg">
                Buy data in seconds — no sign-up required. Delivered straight to any Ghana number.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" asChild className="bg-[hsl(var(--brand-orange))] hover:bg-[hsl(var(--brand-orange))]/90 text-white">
                  <a href="#bundles">Shop bundles <ArrowRight className="ml-1 h-4 w-4" /></a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/signup">Create free account (optional)</Link>
                </Button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
                <Feature icon={<Zap className="h-4 w-4" />} title="Instant" />
                <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Secure" />
                <Feature icon={<LiveClock className="h-4 w-4" />} title="24/7 Live" />
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[hsl(var(--brand-navy))] to-[hsl(var(--brand-navy-2))] rotate-3 opacity-90" />
              <div className="relative rounded-3xl bg-card border shadow-2xl p-6 -rotate-2">
                <div className="flex items-center justify-between">
                  <NetworkBadge network="MTN" />
                  <LiveClock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="mt-6">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Best seller</div>
                  <div className="mt-1 text-3xl font-bold">5 GB</div>
                  <div className="text-sm text-muted-foreground">Valid 30 days</div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="text-4xl font-extrabold text-[hsl(var(--brand-orange))]">GHS 22</span>
                    <span className="text-sm line-through text-muted-foreground mb-1">GHS 28</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                  <div className="rounded-md border py-2">No KYC</div>
                  <div className="rounded-md border py-2">Auto-deliver</div>
                  <div className="rounded-md border py-2">All networks</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4">
          <Alert className="my-6 border-[hsl(var(--brand-orange))]/30">
            <Info className="h-4 w-4 text-[hsl(var(--brand-orange))]" />
            <AlertDescription>
              Payments are currently in <strong>test mode</strong>. Real card payments unlock once Paystack approves the account.
            </AlertDescription>
          </Alert>

          <section id="bundles" className="scroll-mt-20">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold">Choose your bundle</h2>
              <p className="text-muted-foreground">Switch networks below — prices update instantly.</p>
            </div>
            <Tabs defaultValue="MTN" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3 h-12 p-1">
                {networks.map((n) => (
                  <TabsTrigger
                    key={n}
                    value={n}
                    className="data-[state=active]:bg-background data-[state=active]:shadow transition-all duration-300"
                  >
                    {n}
                  </TabsTrigger>
                ))}
              </TabsList>
              {networks.map((n) => (
                <TabsContent
                  key={n}
                  value={n}
                  className="mt-6 data-[state=active]:animate-in data-[state=active]:fade-in-50 data-[state=active]:slide-in-from-bottom-2 data-[state=active]:duration-500"
                >
                  {isLoading ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-44 rounded-xl border bg-muted/40 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {bundles.filter((b) => b.network === n).map((b) => (
                        <Card
                          key={b.id}
                          className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[hsl(var(--brand-orange))]/40"
                        >
                          <div
                            className="absolute inset-x-0 top-0 h-1"
                            style={{
                              background:
                                n === "MTN" ? "#FFCC00" : n === "Telecel" ? "#E30613" : "#00A4E4",
                            }}
                          />
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <NetworkBadge network={b.network} />
                              <span className="text-xs text-muted-foreground">{b.validity}</span>
                            </div>
                            <div className="mt-4">
                              <div className="text-3xl font-extrabold tracking-tight">
                                {(b.data_mb / 1024).toFixed(b.data_mb % 1024 ? 1 : 0)}
                                <span className="text-lg font-semibold text-muted-foreground ml-1">GB</span>
                              </div>
                              <div className="text-sm text-muted-foreground">{b.name}</div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground">Price</div>
                                <div className="text-2xl font-bold text-[hsl(var(--brand-orange))]">
                                  GHS {Number(b.price_ghs).toFixed(2)}
                                </div>
                              </div>
                              <Button onClick={() => onBuy(b)} className="bg-[hsl(var(--brand-navy))] hover:bg-[hsl(var(--brand-navy-2))] text-white">
                                Buy
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </section>
        </div>
      </main>
      <CheckoutDialog bundle={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 flex items-center gap-2">
      <span className="text-[hsl(var(--brand-orange))]">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}
