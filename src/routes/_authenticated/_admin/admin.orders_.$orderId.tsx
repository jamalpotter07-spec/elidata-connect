import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetOrder, adminUpdateOrder, adminMarkPaidManual } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, NetworkBadge } from "@/components/status-badge";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/orders_/$orderId")({
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { orderId } = useParams({ from: "/_authenticated/_admin/admin/orders_/$orderId" });
  const qc = useQueryClient();
  const getOrder = useServerFn(adminGetOrder);
  const update = useServerFn(adminUpdateOrder);
  const markPaid = useServerFn(adminMarkPaidManual);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: () => getOrder({ data: { orderId } }),
  });

  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [resellerRef, setResellerRef] = useState("");

  useEffect(() => {
    if (data?.order) {
      setStatus(data.order.status);
      setNotes(data.order.notes ?? "");
      setResellerRef(data.order.reseller_reference ?? "");
    }
  }, [data?.order]);

  if (isLoading || !data?.order) {
    return <main className="container mx-auto px-4 py-8">Loading…</main>;
  }
  const o = data.order;

  const save = async () => {
    try {
      await update({ data: { orderId, status: status as any, notes, resellerReference: resellerRef } });
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const preorder = async () => {
    if (!confirm(`Pay GHS ${Number(o.amount_ghs).toFixed(2)} from your own funds and mark this order as paid?`)) return;
    try {
      await markPaid({ data: { orderId, note: "Preordered with admin funds — awaiting customer reimbursement" } });
      toast.success("Marked as paid (manual)");
      qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm"><Link to="/admin/orders"><ArrowLeft className="h-4 w-4 mr-1" /> All orders</Link></Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Order details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Order ID"><span className="font-mono">{o.id}</span></Row>
            <Row label="Status"><StatusBadge status={o.status} /></Row>
            <Row label="Network"><NetworkBadge network={o.network} /></Row>
            <Row label="Bundle">{(o.data_mb / 1024).toFixed(1)} GB</Row>
            <Row label="Recipient"><span className="font-mono">{o.recipient_phone}</span></Row>
            <Row label="Amount">GHS {Number(o.amount_ghs).toFixed(2)}</Row>
            <Row label="Customer">{o.user_id ? <span className="font-mono text-xs">{o.user_id}</span> : <span className="text-muted-foreground">Guest {o.guest_email ? `(${o.guest_email})` : ""}</span>}</Row>
            <Row label="Paystack ref">{o.paystack_reference ?? "—"}</Row>
            <Row label="Reseller ref">{o.reseller_reference ?? "—"}</Row>
            <Row label="Created">{new Date(o.created_at).toLocaleString()}</Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pending","paid","processing","delivered","failed","refunded"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Reseller reference</Label>
              <Input value={resellerRef} onChange={(e) => setResellerRef(e.target.value)} placeholder="e.g. DM-12345" />
            </div>
            <div className="space-y-1">
              <Label>Internal notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
            </div>
            <Button className="w-full" onClick={save}>Save changes</Button>
            {o.status === "pending" && (
              <Button onClick={preorder} variant="outline" className="w-full border-[hsl(var(--brand-orange))]/40">
                <Wallet className="h-4 w-4 mr-2" /> Preorder with own funds
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
        <CardContent>
          {data.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="space-y-2 text-sm">
              {data.payments.map((p: any) => (
                <div key={p.id} className="rounded border p-3 flex flex-wrap justify-between gap-2">
                  <div>
                    <div className="font-mono">{p.reference}</div>
                    <div className="text-xs text-muted-foreground">{p.provider} · {new Date(p.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">GHS {Number(p.amount_ghs).toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{p.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b last:border-0 pb-2 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
