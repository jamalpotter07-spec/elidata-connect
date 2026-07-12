import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats, adminListBundles, adminListOrders, adminRefundOrder } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NetworkBadge, StatusBadge } from "@/components/status-badge";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { ManualOrderCard } from "@/components/manual-order-card";
import { ProfitCalculatorCard } from "@/components/profit-calculator-card";

export const Route = createFileRoute("/_authenticated/_admin/admin/")({ component: AdminHome });

function AdminHome() {
  const qc = useQueryClient();
  const statsFn = useServerFn(adminStats);
  const bundlesFn = useServerFn(adminListBundles);
  const ordersFn = useServerFn(adminListOrders);
  const refundFn = useServerFn(adminRefundOrder);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });
  const { data: bundlesData } = useQuery({ queryKey: ["admin-bundles"], queryFn: () => bundlesFn() });
  const { data: ordersData } = useQuery({ queryKey: ["admin-orders"], queryFn: () => ordersFn() });
  const counts = data?.counts ?? {};
  const bundles = bundlesData?.bundles ?? [];
  const refundable = (ordersData?.orders ?? []).filter((o: any) =>
    ["paid", "delivered", "failed"].includes(o.status),
  ).slice(0, 10);

  const onRefund = async (orderId: string, phone: string) => {
    const reason = prompt(`Refund order to ${phone}?\nEnter reason (shown in notes):`);
    if (reason === null) return;
    try {
      await refundFn({ data: { orderId, reason } });
      toast.success("Customer refunded");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Refund failed");
    }
  };

  const totalCost = bundles.reduce((s: number, b: any) => s + Number(b.cost_price_ghs ?? 0), 0);
  const totalPrice = bundles.reduce((s: number, b: any) => s + Number(b.price_ghs ?? 0), 0);
  const avgMargin = totalPrice > 0 ? (((totalPrice - totalCost) / totalPrice) * 100).toFixed(0) + "%" : "—";

  return (
    <main className="container mx-auto px-4 py-6 space-y-6" style={{ paddingTop: "96px" }}>
      {/* Manual order — always at the very top so it's reachable on mobile without scrolling */}
      <ManualOrderCard />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/admin/bundles">Bundles</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/admin/orders">Orders</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/admin/users">Users</Link></Button>
        </div>
      </div>

      <ProfitCalculatorCard />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat title="Total revenue" value={`GHS ${Number(data?.totalRevenue ?? 0).toFixed(2)}`} />
        <Stat title="Total orders" value={String(data?.totalOrders ?? 0)} />
        <Stat title="Average margin" value={avgMargin} />
        <Stat title="Delivered" value={String(counts.delivered ?? 0)} />
        <Stat title="Pending" value={String(counts.pending ?? 0)} />
        <Stat title="Failed" value={String(counts.failed ?? 0)} />
      </div>


      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>API base prices & margins</CardTitle>
          <Button asChild size="sm" variant="outline"><Link to="/admin/bundles">Edit prices</Link></Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Network</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>API cost</TableHead>
                <TableHead>Sell price</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.map((b: any) => {
                const cost = Number(b.cost_price_ghs ?? 0);
                const price = Number(b.price_ghs);
                const profit = price - cost;
                const marginPct = cost > 0 ? ((price - cost) / price) * 100 : 0;
                const margin = cost > 0 ? marginPct.toFixed(0) + "%" : "—";
                const low = cost > 0 && marginPct < 10;
                return (
                  <TableRow key={b.id} className={low ? "bg-destructive/5" : undefined}>
                    <TableCell><NetworkBadge network={b.network} /></TableCell>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cost > 0 ? `GHS ${cost.toFixed(2)}` : "—"}</TableCell>
                    <TableCell>GHS {price.toFixed(2)}</TableCell>
                    <TableCell className={profit > 0 ? "text-green-600" : "text-destructive"}>GHS {profit.toFixed(2)}</TableCell>
                    <TableCell className={low ? "text-destructive font-semibold" : ""}>{margin}{low ? " ⚠" : ""}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Quick refunds</CardTitle>
          <Button asChild size="sm" variant="outline"><Link to="/admin/orders">All orders</Link></Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {refundable.length === 0 ? (
            <p className="text-sm text-muted-foreground">No refundable orders.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refundable.map((o: any) => (
                  <TableRow key={o.id}>
                    <TableCell><StatusBadge status={o.status} /></TableCell>
                    <TableCell><NetworkBadge network={o.network} /></TableCell>
                    <TableCell className="font-mono text-xs">{o.recipient_phone}</TableCell>
                    <TableCell>GHS {Number(o.amount_ghs).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/40 hover:bg-destructive/10"
                        onClick={() => onRefund(o.id, o.recipient_phone)}
                      >
                        <Undo2 className="h-3.5 w-3.5 mr-1" /> Refund
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
    </Card>
  );
}

