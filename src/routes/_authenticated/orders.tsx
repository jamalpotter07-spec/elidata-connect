import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyOrders } from "@/lib/orders.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, NetworkBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_authenticated/orders")({ component: OrdersPage });

function OrdersPage() {
  const fn = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });
  const orders = data?.orders ?? [];

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">My orders</h1>
      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Network</TableHead>
              <TableHead>Bundle</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={6}>No orders yet.</TableCell></TableRow>
            ) : (
              orders.map((o: any) => (
                <TableRow key={o.id}>
                  <TableCell><NetworkBadge network={o.network} /></TableCell>
                  <TableCell>
                    <Link to="/orders/$orderId" params={{ orderId: o.id }} className="text-primary hover:underline">
                      {(o.data_mb / 1024).toFixed(1)} GB
                    </Link>
                  </TableCell>
                  <TableCell>{o.recipient_phone}</TableCell>
                  <TableCell>GHS {Number(o.amount_ghs).toFixed(2)}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
