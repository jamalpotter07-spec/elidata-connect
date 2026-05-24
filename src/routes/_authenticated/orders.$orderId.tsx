import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOrder } from "@/lib/orders.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, NetworkBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/orders/$orderId")({ component: OrderDetailPage });

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const fn = useServerFn(getMyOrder);
  const { data, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fn({ data: { orderId } }),
    refetchInterval: 3000,
  });

  if (isLoading) return <main className="container mx-auto px-4 py-8">Loading…</main>;
  const o = data?.order;
  if (!o) return <main className="container mx-auto px-4 py-8">Order not found.</main>;

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8">
      <Button variant="ghost" asChild><Link to="/orders">← Back to orders</Link></Button>
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order #{o.id.slice(0, 8)}</CardTitle>
            <StatusBadge status={o.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row label="Network"><NetworkBadge network={o.network} /></Row>
          <Row label="Data">{(o.data_mb / 1024).toFixed(2)} GB</Row>
          <Row label="Recipient">{o.recipient_phone}</Row>
          <Row label="Amount">GHS {Number(o.amount_ghs).toFixed(2)}</Row>
          <Row label="Reference">{o.paystack_reference ?? "—"}</Row>
          <Row label="Reseller ref">{o.reseller_reference ?? "—"}</Row>
          <Row label="Created">{new Date(o.created_at).toLocaleString()}</Row>
          {o.notes && <Row label="Notes">{o.notes}</Row>}
        </CardContent>
      </Card>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}
