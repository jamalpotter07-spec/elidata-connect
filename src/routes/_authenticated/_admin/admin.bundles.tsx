import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListBundles, adminUpsertBundle, adminDeleteBundle } from "@/lib/admin.functions";
import { adminListBundles, adminUpsertBundle, adminDeleteBundle, adminBulkAdjustPrices } from "@/lib/admin.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { NetworkBadge } from "@/components/status-badge";
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
  const qc = useQueryClient();
  const list = useServerFn(adminListBundles);
  const upsert = useServerFn(adminUpsertBundle);
  const del = useServerFn(adminDeleteBundle);
  const bulkAdjust = useServerFn(adminBulkAdjustPrices);
  const { data } = useQuery({ queryKey: ["admin-bundles"], queryFn: () => list() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bundle>(empty);
  const [pct, setPct] = useState<number>(5);
  const [pctNet, setPctNet] = useState<"ALL" | "MTN" | "Telecel" | "AT">("ALL");
  const [pctBasis, setPctBasis] = useState<"sell" | "cost">("sell");

  const applyBulk = async () => {
    if (!confirm(`Adjust ${pctNet} prices by ${pct}% (basis: ${pctBasis})?`)) return;
    try {
      const r = await bulkAdjust({ data: { percent: pct, network: pctNet, basis: pctBasis } });
      toast.success(`Updated ${r.updated} bundle(s)`);
      qc.invalidateQueries({ queryKey: ["admin-bundles"] });
      qc.invalidateQueries({ queryKey: ["bundles"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk adjust failed");
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bundles</h1>
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
                <Label>Data (MB)</Label>
                <Input type="number" value={editing.data_mb} onChange={(e) => setEditing({ ...editing, data_mb: Number(e.target.value) })} />
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

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Network</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>API cost</TableHead>
              <TableHead>Sell price</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead>Active</TableHead>
              <TableHead></TableHead>
            </TableRow>
      {/* Bulk % price adjuster */}
      <div className="mt-6 rounded-lg border bg-muted/30 p-4">
        <div className="text-sm font-medium mb-2">Bulk adjust prices by %</div>
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
            <Label className="text-xs">Basis</Label>
            <Select value={pctBasis} onValueChange={(v) => setPctBasis(v as any)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sell">Current sell price</SelectItem>
                <SelectItem value="cost">API cost price</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Percent (+ markup, − discount)</Label>
            <Input type="number" step="0.5" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-32" />
          </div>
          <Button onClick={applyBulk} variant="secondary">Apply</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Example: basis <em>API cost</em> + 20% sets every sell price to 1.20× its cost.
          Basis <em>Current sell</em> + 5% bumps every active sell price up by 5%.
        </p>
      </div>


          <TableBody>
            {(data?.bundles ?? []).map((b: any) => {
              const cost = Number(b.cost_price_ghs ?? 0);
              const price = Number(b.price_ghs);
              const margin = cost > 0 ? (((price - cost) / price) * 100).toFixed(0) + "%" : "—";
              return (
              <TableRow key={b.id}>
                <TableCell><NetworkBadge network={b.network} /></TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell>{(b.data_mb / 1024).toFixed(1)} GB</TableCell>
                <TableCell className="text-muted-foreground">{cost > 0 ? `GHS ${cost.toFixed(2)}` : "—"}</TableCell>
                <TableCell className="font-medium">GHS {price.toFixed(2)}</TableCell>
                <TableCell>{margin}</TableCell>
                <TableCell>{b.active ? "Yes" : "No"}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(b); setOpen(true); }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(b.id)}>Delete</Button>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
