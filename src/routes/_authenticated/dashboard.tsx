import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyOrders } from "@/lib/orders.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, NetworkBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const fn = useServerFn(listMyOrders);
  const { data } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });
  const orders = data?.orders ?? [];
  const recent = orders.slice(0, 5);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild><Link to="/">Buy bundle</Link></Button>
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>Recent orders</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground">No orders yet. <Link to="/" className="text-primary">Browse bundles</Link>.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((o: any) => (
                <li key={o.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <NetworkBadge network={o.network} />
                    <div>
                      <p className="font-medium">{(o.data_mb / 1024).toFixed(1)} GB → {o.recipient_phone}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">GHS {Number(o.amount_ghs).toFixed(2)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
