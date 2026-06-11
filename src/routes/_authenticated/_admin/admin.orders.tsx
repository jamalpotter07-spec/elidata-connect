import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListOrders } from "@/lib/admin.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, NetworkBadge } from "@/components/status-badge";
import { ManualOrderCard } from "@/components/manual-order-card";

export const Route = createFileRoute("/_authenticated/_admin/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const fn = useServerFn(adminListOrders);
  const { data, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => fn() });
  const orders = data?.orders ?? [];

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <ManualOrderCard />
      <h1 className="text-2xl font-bold">All orders</h1>
      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7}>Loading…</TableCell></TableRow>
            ) : orders.map((o: any) => (
              <TableRow key={o.id} className="cursor-pointer hover:bg-muted/40">
                <TableCell className="font-mono text-xs">
                  <Link to="/admin/orders/$orderId" params={{ orderId: o.id }} className="hover:underline">{o.id.slice(0, 8)}</Link>
                </TableCell>
                <TableCell><NetworkBadge network={o.network} /></TableCell>
                <TableCell>{(o.data_mb / 1024).toFixed(1)} GB</TableCell>
                <TableCell>{o.recipient_phone}</TableCell>
                <TableCell>GHS {Number(o.amount_ghs).toFixed(2)}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
