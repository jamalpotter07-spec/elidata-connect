import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListBundles, adminUpsertBundle, adminDeleteBundle } from "@/lib/admin.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  validity: string;
  active: boolean;
  sort_order: number;
};

const empty: Bundle = { network: "MTN", name: "", data_mb: 1024, price_ghs: 5, validity: "30 days", active: true, sort_order: 0 };

function AdminBundles() {
  const qc = useQueryClient();
  const list = useServerFn(adminListBundles);
  const upsert = useServerFn(adminUpsertBundle);
  const del = useServerFn(adminDeleteBundle);
  const { data } = useQuery({ queryKey: ["admin-bundles"], queryFn: () => list() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bundle>(empty);

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
                <Label>Price (GHS)</Label>
                <Input type="number" step="0.01" value={editing.price_ghs} onChange={(e) => setEditing({ ...editing, price_ghs: Number(e.target.value) })} />
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
              <TableHead>Price</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead>Active</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.bundles ?? []).map((b: any) => (
              <TableRow key={b.id}>
                <TableCell><NetworkBadge network={b.network} /></TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell>{(b.data_mb / 1024).toFixed(1)} GB</TableCell>
                <TableCell>GHS {Number(b.price_ghs).toFixed(2)}</TableCell>
                <TableCell>{b.validity}</TableCell>
                <TableCell>{b.active ? "Yes" : "No"}</TableCell>
                <TableCell className="space-x-2 text-right">
                  <Button variant="outline" size="sm" onClick={() => { setEditing(b); setOpen(true); }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(b.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
