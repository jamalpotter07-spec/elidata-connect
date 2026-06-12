import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOrder, reorderOrder } from "@/lib/orders.functions";
import { payAndFulfill } from "@/lib/checkout.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, NetworkBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orders/$orderId")({ component: OrderDetailPage });

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const fn = useServerFn(getMyOrder);
  const reorder = useServerFn(reorderOrder);
  const pay = useServerFn(payAndFulfill);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => fn({ data: { orderId } }),
    refetchInterval: 3000,
  });

  if (isLoading) return <main className="container mx-auto px-4 py-8">Loading…</main>;
  const o = data?.order;
  if (!o) return <main className="container mx-auto px-4 py-8">Order not found.</main>;

  const onReorder = async () => {
    setBusy(true);
    try {
      const { orderId: newId } = await reorder({ data: { orderId } });
      pay({ data: { orderId: newId } }).catch(() => {});
      toast.success("Re-order placed — taking you to live tracking");
      navigate({ to: "/orders/$orderId", params: { orderId: newId } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not re-order");
    } finally {
      setBusy(false);
    }
  };

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
          <div className="pt-4 space-y-2">
            <Button onClick={onReorder} disabled={busy} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {busy ? "Placing…" : `Re-order ${(o.data_mb / 1024).toFixed(1)} GB to ${o.recipient_phone}`}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => shareReceipt(o)}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share receipt on WhatsApp
            </Button>
          </div>
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

function shareReceipt(o: any) {
  const gb = (o.data_mb / 1024).toFixed(1);
  const trackUrl = `${window.location.origin}/track/${o.id}`;
  const lines = [
    `🧾 *Eli Data Resales — receipt*`,
    ``,
    `Order: #${String(o.id).slice(0, 8)}`,
    `Network: ${o.network}`,
    `Bundle: ${gb} GB`,
    `Recipient: ${o.recipient_phone}`,
    `Amount: GHS ${Number(o.amount_ghs).toFixed(2)}`,
    `Status: ${o.status}`,
    o.reseller_reference ? `Reference: ${o.reseller_reference}` : null,
    ``,
    `Track live: ${trackUrl}`,
    `Thanks for buying with Eli Data Resales 💙`,
  ].filter(Boolean).join("\n");
  const text = encodeURIComponent(lines);
  // Try native share first (mobile), then fall back to WhatsApp web/app link.
  const navAny: any = typeof navigator !== "undefined" ? navigator : null;
  if (navAny?.share) {
    navAny.share({ title: "Eli Data Resales receipt", text: lines }).catch(() => {
      window.open(`https://wa.me/?text=${text}`, "_blank");
    });
  } else {
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }
  toast.success("Opening WhatsApp share…");
}

