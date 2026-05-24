import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listActiveBundles } from "@/lib/bundles.functions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Zap, ShieldCheck, Clock } from "lucide-react";
import { NavBar } from "@/components/nav-bar";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { NetworkBadge } from "@/components/status-badge";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "DataPlug GH — Cheap MTN, Telecel & AT data bundles" },
      {
        name: "description",
        content:
          "Buy MTN, Telecel and AT data bundles at the cheapest rates in Ghana. Instant delivery.",
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
  const { user } = useAuth();
  const [selected, setSelected] = useState<Bundle | null>(null);
  const [open, setOpen] = useState(false);

  const bundles = (data?.bundles ?? []) as Bundle[];
  const networks: Array<"MTN" | "Telecel" | "AT"> = ["MTN", "Telecel", "AT"];

  const onBuy = (b: Bundle) => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setSelected(b);
    setOpen(true);
  };

  return (
    <>
      <NavBar />
      <main className="container mx-auto px-4 pb-16">
        {/* Hero */}
        <section className="py-12 md:py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Cheap data bundles for MTN, Telecel & AT
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Buy data in seconds. Delivered straight to any Ghana number — at the lowest prices.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <a href="#bundles">Shop bundles</a>
            </Button>
            {!user && (
              <Button size="lg" variant="outline" asChild>
                <Link to="/signup">Create free account</Link>
              </Button>
            )}
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
            <Feature icon={<Zap className="h-5 w-5" />} title="Instant" desc="Bundles delivered in seconds" />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Secure" desc="Safe payments & accounts" />
            <Feature icon={<Clock className="h-5 w-5" />} title="24/7" desc="Buy any time, any day" />
          </div>
        </section>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Payments are currently in <strong>test mode</strong>. Real card payments will be live once Paystack approves the account.
          </AlertDescription>
        </Alert>

        <section id="bundles">
          <Tabs defaultValue="MTN" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              {networks.map((n) => (
                <TabsTrigger key={n} value={n}>{n}</TabsTrigger>
              ))}
            </TabsList>
            {networks.map((n) => (
              <TabsContent key={n} value={n} className="mt-6">
                {isLoading ? (
                  <p className="text-muted-foreground">Loading bundles…</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {bundles.filter((b) => b.network === n).map((b) => (
                      <Card key={b.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <NetworkBadge network={b.network} />
                            <span className="text-xs text-muted-foreground">{b.validity}</span>
                          </div>
                          <CardTitle className="mt-2">{b.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">GHS {Number(b.price_ghs).toFixed(2)}</p>
                          <Button className="mt-3 w-full" onClick={() => onBuy(b)}>Buy now</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </main>
      <CheckoutDialog bundle={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-left">
      <div className="flex items-center gap-2 text-primary">{icon}<span className="font-semibold">{title}</span></div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
