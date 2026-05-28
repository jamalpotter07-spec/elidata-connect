import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats, adminListBundles } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NetworkBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_authenticated/_admin/admin/")({ component: AdminHome });

function AdminHome() {
  const statsFn = useServerFn(adminStats);
  const bundlesFn = useServerFn(adminListBundles);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => statsFn() });
  const { data: bundlesData } = useQuery({ queryKey: ["admin-bundles"], queryFn: () => bundlesFn() });
  const counts = data?.counts ?? {};
  const bundles = bundlesData?.bundles ?? [];

  const totalCost = bundles.reduce((s: number, b: any) => s + Number(b.cost_price_ghs ?? 0), 0);
  const totalPrice = bundles.reduce((s: number, b: any) => s + Number(b.price_ghs ?? 0), 0);
  const avgMargin = totalPrice > 0 ? (((totalPrice - totalCost) / totalPrice) * 100).toFixed(0) + "%" : "—";

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/admin/bundles">Bundles</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/orders">Orders</Link></Button>
          <Button asChild variant="outline"><Link to="/admin/users">Users</Link></Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
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
                    <TableCell>{(b.data_mb / 1024).toFixed(1)} GB</TableCell>
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
