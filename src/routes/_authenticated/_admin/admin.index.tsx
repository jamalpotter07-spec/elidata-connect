import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminStats } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/_admin/admin/")({ component: AdminHome });

function AdminHome() {
  const fn = useServerFn(adminStats);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fn() });
  const counts = data?.counts ?? {};

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
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat title="Total revenue" value={`GHS ${Number(data?.totalRevenue ?? 0).toFixed(2)}`} />
        <Stat title="Total orders" value={String(data?.totalOrders ?? 0)} />
        <Stat title="Delivered" value={String(counts.delivered ?? 0)} />
        <Stat title="Pending" value={String(counts.pending ?? 0)} />
        <Stat title="Failed" value={String(counts.failed ?? 0)} />
        <Stat title="Paid" value={String(counts.paid ?? 0)} />
      </div>
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
