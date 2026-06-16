import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { adminListOrders } from "@/lib/admin.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, NetworkBadge } from "@/components/status-badge";
import { ManualOrderCard } from "@/components/manual-order-card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const fn = useServerFn(adminListOrders);
  const [pages, setPages] = useState<any[][]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);

  // First page via react-query for caching
  const { data: firstPage, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => fn({ data: {} }),
  });

  const allOrders = [
    ...(firstPage?.orders ?? []),
    ...pages.flat(),
  ];

  const lastCursor = pages.length > 0
    ? (firstPage?.nextCursor ? cursor : null)
    : firstPage?.nextCursor;

  const handleLoadMore = async () => {
    const nextCursor = pages.length === 0
      ? firstPage?.nextCursor
      : cursor;
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const result = await fn({ data: { cursor: nextCursor } });
      setPages((prev) => [...prev, result.orders]);
      setCursor(result.nextCursor ?? undefined);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = pages.length === 0
    ? !!firstPage?.nextCursor
    : !!cursor;

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <ManualOrderCard />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">All orders</h1>
        <span className="text-sm text-muted-foreground">{allOrders.length} loaded</span>
      </div>

      {/* Truncation warning — only shown on the first page when more rows exist */}
      {firstPage?.truncated && pages.length === 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Showing the most recent 100 orders. Use <strong>Load more</strong> below to see older orders.
          </p>
        </div>
      )}

      <div className="rounded-lg border">
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
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading…</TableCell></TableRow>
            ) : allOrders.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No orders yet.</TableCell></TableRow>
            ) : allOrders.map((o: any) => (
              <TableRow key={o.id} className="cursor-pointer hover:bg-muted/40">
                <TableCell className="font-mono text-xs">
                  <Link to="/admin/orders/$orderId" params={{ orderId: o.id }} className="hover:underline">
                    {o.id.slice(0, 8)}
                  </Link>
                </TableCell>
                <TableCell><NetworkBadge network={o.network} /></TableCell>
                <TableCell>{(o.data_mb / 1024).toFixed(1)} GB</TableCell>
                <TableCell>{o.recipient_phone}</TableCell>
                <TableCell>GHS {Number(o.amount_ghs).toFixed(2)}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more orders"}
          </Button>
        </div>
      )}
    </main>
  );
}
