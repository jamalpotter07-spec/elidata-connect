import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListBundles,
  adminUpsertBundle,
  adminDeleteBundle,
  adminBulkAdjustPrices,
  adminSyncMobighPrices,
  adminMobighBalance,
} from "@/lib/admin.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NetworkBadge } from "@/components/status-badge";
import { ManualOrderCard } from "@/components/manual-order-card";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/admin/bundles")({ component: AdminBundles });

type Bundle = {
  id?: string;
  network: "MTN" | "Telecel" | "AT";
  name: string;
  data_mb: number;
  price_ghs: number;
  cost_price_ghs?: number | null;
  validity: string;
  active: boolean;
  sort_order: number;
};

const empty: Bundle = { network: "MTN", name: "", data_mb: 1024, price_ghs: 5, cost_price_ghs: 0, validity: "30 days", active: true, sort_order: 0 };

function AdminBundles() {
  const qc = useQueryClient();
  const list = useServerFn(adminListBundles);
  const upsert = useServerFn(adminUpsertBundle);
  const del = useServerFn(adminDeleteBundle);
  const bulkAdjust = useServerFn(adminBulkAdjustPrices);
  const syncMobigh = useServerFn(adminSyncMobighPrices);
  const fetchBalance = useServerFn(adminMobighBalance);
  const { data } = useQuery({ queryKey: ["admin-bundles"], queryFn: () => list() });
  const balanceQ = useQuery({ queryKey: ["mobigh-balance"], queryFn: () => fetchBalance(), refetchInterval: 60_000 });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bundle>(empty);
  const [pct, setPct] = useState<number>(20);
  const [pctNet, setPctNet] = useState<"ALL" | "MTN" | "Telecel" | "AT">("ALL");
  const [syncing, setSyncing] = useState(false);

  const doSync = async () => {
    if (!confirm(`Sync wholesale prices from Mobigh and set sell = cost × (1 + ${pct}%)?`)) return;
    setSyncing(true);
    try {
      const r = await syncMobigh({ data: { marginPercent: pct } });
      toast.success(`Synced ${r.updated} bundle(s) · skipped ${r.skipped}`);
      qc.invalidateQueries({ queryKey: ["admin-bundles"] });
      qc.invalidateQueries({ queryKey: ["bundles"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const save = async () => {
    try {
      await upsert({ data: editing });
      toast.success("Saved");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-bundles"] });
      qc.invalidateQueries({ queryKey: ["bundles"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;
    await del({ data: { id } });
    qc.invalidateQueries({ queryKey: ["admin-bundles"] });
    qc.invalidateQueries({ queryKey: ["bundles"] });
  };

  const applyBulk = async () => {
    if (!confirm(`Reset ${pctNet} sell prices to API cost + ${pct}% margin?\nThis OVERWRITES current sell prices.`)) return;
    try {
      const r = await bulkAdjust({ data: { percent: pct, network: pctNet } });
      toast.success(`Reset ${r.updated} bundle(s)${r.skipped ? ` · skipped ${r.skipped} (no cost)` : ""}`);
      qc.invalidateQueries({ queryKey: ["admin-bundles"] });
      qc.invalidateQueries({ queryKey: ["bundles"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk adjust failed");
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <ManualOrderCard />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Bundles</h1>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs">
            Mobigh wallet: <strong>{balanceQ.data ? `GHS ${balanceQ.data.balance.toFixed(2)}` : "…"}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={doSync} disabled={syncing}>
            {syncing ? "Syncing…" : `Sync from Mobigh (+${pct}%)`}
          </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)}>New bundle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Edit" : "New"} bundle</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Network</Label>
                <Select value={editing.network} onValueChange={(v) => setEditing({ ...editing, network: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="Telecel">Telecel</SelectItem>
                    <SelectItem value="AT">AT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Data (GB)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={+(editing.data_mb / 1024).toFixed(3)}
                  onChange={(e) => setEditing({ ...editing, data_mb: Math.round(Number(e.target.value) * 1024) })}
                />
                <p className="text-xs text-muted-foreground">
                  = <strong>{editing.data_mb} MB</strong> · shows as{" "}
                  <strong>{(editing.data_mb / 1024).toFixed(editing.data_mb % 1024 ? 1 : 0)} GB</strong> on the bundles card
                </p>
              </div>
              <div className="space-y-1">
                <Label>Data (MB) — exact</Label>
                <Input
                  type="number"
                  value={editing.data_mb}
                  onChange={(e) => setEditing({ ...editing, data_mb: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">1 GB = 1024 MB. Edit either field.</p>
              </div>
              <div className="space-y-1">
                <Label>Sell price (GHS)</Label>
                <Input type="number" step="0.01" value={editing.price_ghs} onChange={(e) => setEditing({ ...editing, price_ghs: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>API base cost (GHS)</Label>
                <Input type="number" step="0.01" value={editing.cost_price_ghs ?? 0} onChange={(e) => setEditing({ ...editing, cost_price_ghs: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>Validity</Label>
                <Input value={editing.validity} onChange={(e) => setEditing({ ...editing, validity: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Sort order</Label>
                <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Bulk % margin reset */}
      <div className="mt-6 rounded-lg border bg-muted/30 p-4">
        <div className="text-sm font-medium mb-1">Reset profit margin</div>
        <p className="text-xs text-muted-foreground mb-3">
          Always recomputes from API cost: <strong>sell = cost × (1 + %)</strong>.
          Re-running with the same % gives the same prices — it never stacks.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Network</Label>
            <Select value={pctNet} onValueChange={(v) => setPctNet(v as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="MTN">MTN</SelectItem>
                <SelectItem value="Telecel">Telecel</SelectItem>
                <SelectItem value="AT">AT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Margin %</Label>
            <Input type="number" step="0.5" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-32" />
          </div>
          <Button onClick={applyBulk} variant="secondary">Reset prices</Button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Network</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>API cost</TableHead>
              <TableHead>Sell price</TableHead>
              <TableHead>Profit / unit</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead>Active</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              const rows = (data?.bundles ?? []) as any[];
              let totalProfit = 0;
              const rendered = rows.map((b: any) => {
                const cost = Number(b.cost_price_ghs ?? 0);
                const price = Number(b.price_ghs);
                const profit = cost > 0 ? price - cost : 0;
                if (cost > 0) totalProfit += profit;
                const margin = cost > 0 ? ((profit / cost) * 100).toFixed(1) + "%" : "—";
                return (
                  <TableRow key={b.id}>
                    <TableCell><NetworkBadge network={b.network} /></TableCell>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{(b.data_mb / 1024).toFixed(b.data_mb % 1024 ? 1 : 0)} GB</TableCell>
                    <TableCell className="text-muted-foreground">{cost > 0 ? `GHS ${cost.toFixed(2)}` : "—"}</TableCell>
                    <TableCell className="font-medium">GHS {price.toFixed(2)}</TableCell>
                    <TableCell className={profit >= 0 ? "text-green-600" : "text-destructive"}>
                      {cost > 0 ? `GHS ${profit.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell>{margin}</TableCell>
                    <TableCell>{b.active ? "Yes" : "No"}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => { setEditing(b); setOpen(true); }}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(b.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                );
              });
              return (
                <>
                  {rendered}
                  {rows.length > 0 && (
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell colSpan={5} className="text-right">Total profit per 1 sale of every bundle</TableCell>
                      <TableCell className="text-green-600">GHS {totalProfit.toFixed(2)}</TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  )}
                </>
              );
            })()}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
