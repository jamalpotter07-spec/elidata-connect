import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGuestOrder } from "@/lib/orders.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/nav-bar";
import { NetworkBadge, StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/track/$orderId")({
  component: TrackPage,
  head: () => ({ meta: [{ title: "Track order — DataPlug GH" }] }),
});

function TrackPage() {
  const { orderId } = Route.useParams();
  const fn = useServerFn(getGuestOrder);
  const { data, isLoading } = useQuery({
    queryKey: ["track", orderId],
    queryFn: () => fn({ data: { orderId } }),
    refetchInterval: 3000,
  });
  const order: any = data?.order;
  return (
    <>
      <NavBar />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Order tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-muted-foreground">Loading…</p>
            ) : !order ? (
              <p>Order not found.</p>
            ) : (
              <>
                <div className="flex items-center gap-2"><NetworkBadge network={order.network} /><StatusBadge status={order.status} /></div>
                <div className="text-sm text-muted-foreground">Reference: <span className="font-mono">{order.id.slice(0, 8)}</span></div>
                <div>To: <span className="font-medium">{order.recipient_phone}</span></div>
                <div>Bundle: <span className="font-medium">{(order.data_mb / 1024).toFixed(1)} GB</span></div>
                <div>Amount: <span className="font-medium">GHS {Number(order.amount_ghs).toFixed(2)}</span></div>
                <div className="pt-4"><Button asChild variant="outline"><Link to="/">Buy another bundle</Link></Button></div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
