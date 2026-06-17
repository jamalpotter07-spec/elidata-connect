import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminProfitReport } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NetworkBadge, StatusBadge } from "@/components/status-badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "7d",    label: "Last 7 days" },
  { id: "30d",   label: "Last 30 days" },
  { id: "all",   label: "All time" },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

// Mirror the shape returned by adminProfitReport after the #8 refund fix.
// grossRevenue = sum of all sale amounts (before refunds)
// refunds      = total refund amount subtracted
// netRevenue   = grossRevenue − refunds (the real money in)
type ProfitTotals = {
  grossRevenue: number;
  refunds:      number;
  netRevenue:   number;
  cost:         number;
  profit:       number;
  sales:        number;
};

const EMPTY_TOTALS: ProfitTotals = {
  grossRevenue: 0,
  refunds:      0,
  netRevenue:   0,
  cost:         0,
  profit:       0,
  sales:        0,
};

export function ProfitCalculatorCard() {
  const [range, setRange] = useState<RangeId>("7d");
  const fn = useServerFn(adminProfitReport);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-profit", range],
    queryFn:  () => fn({ data: { range } }),
  });

  const totals: ProfitTotals = data?.totals ?? EMPTY_TOTALS;
  const sales = data?.sales ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Profit calculator</CardTitle>
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant={range === r.id ? "default" : "outline"}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Summary tiles ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Tile label="Sales"        value={String(totals.sales)} />
          <Tile label="Gross revenue" value={`GHS ${totals.grossRevenue.toFixed(2)}`} />
          <Tile label="Refunds"      value={`− GHS ${totals.refunds.toFixed(2)}`}
            highlight={totals.refunds > 0 ? "bad" : undefined} />
          <Tile label="Net revenue"  value={`GHS ${totals.netRevenue.toFixed(2)}`} />
          <Tile label="Cost"         value={`GHS ${totals.cost.toFixed(2)}`} />
          <Tile
            label="Profit"
            value={`GHS ${totals.profit.toFixed(2)}`}
            highlight={totals.profit >= 0 ? "good" : "bad"}
          />
        </div>

        {/* ── Per-sale table ── */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Bundle</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8}>Loading…</TableCell></TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    No sales in this range.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell><NetworkBadge network={s.network} /></TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.bundle_name ?? `${s.data_mb}MB`}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.recipient_phone}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right">
                      GHS {Number(s.revenue).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      GHS {Number(s.cost).toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        s.profit >= 0 ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      GHS {Number(s.profit).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function Tile({
  label, value, highlight,
}: {
  label: string; value: string; highlight?: "good" | "bad";
}) {
  const color =
    highlight === "good" ? "text-green-600"
    : highlight === "bad" ? "text-destructive"
    : "";
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
