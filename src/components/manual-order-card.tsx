import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListBundles, adminManualOrder } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function ManualOrderCard() {
  const qc = useQueryClient();
  const bundlesFn = useServerFn(adminListBundles);
  const manualFn = useServerFn(adminManualOrder);
  const { data: bundlesData } = useQuery({ queryKey: ["admin-bundles"], queryFn: () => bundlesFn() });
  const bundles = bundlesData?.bundles ?? [];

  const [network, setNetwork] = useState<"MTN" | "Telecel" | "AT" | "">("");
  const [bundleId, setBundleId] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const activeBundles = useMemo(
    () => bundles.filter((b: any) => b.active && (!network || b.network === network)),
    [bundles, network],
  );
  const selected = activeBundles.find((b: any) => b.id === bundleId);

  const submit = async () => {
    if (!bundleId) return toast.error("Select a bundle");
    if (!/^0\d{9}$/.test(phone.trim())) return toast.error("Enter a valid 10-digit Ghana phone (e.g. 0241234567)");
    setBusy(true);
    try {
      const res = await manualFn({ data: { bundleId, recipientPhone: phone.trim(), note: note.trim() || undefined } });
      if (res.ok) {
        toast.success(`Delivered to ${phone}`);
        setPhone(""); setNote(""); setBundleId("");
      } else {
        toast.error(`Failed: ${(res as any).error ?? "unknown"}`);
      }
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Manual order failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-brand/60 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-brand" /> Manual order (offline customer)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Fulfill a DM/WhatsApp order directly via Mobigh. Skips Paystack and records the order as paid + delivered.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label className="text-xs">Network</Label>
            <Select value={network} onValueChange={(v) => { setNetwork(v as any); setBundleId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select network" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MTN">MTN</SelectItem>
                <SelectItem value="Telecel">Telecel</SelectItem>
                <SelectItem value="AT">AirtelTigo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Bundle</Label>
            <Select value={bundleId} onValueChange={setBundleId} disabled={!network}>
              <SelectTrigger><SelectValue placeholder={network ? "Select bundle" : "Pick network first"} /></SelectTrigger>
              <SelectContent>
                {activeBundles.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} — GHS {Number(b.price_ghs).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Recipient phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0241234567" inputMode="numeric" />
          </div>
          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. WhatsApp customer" />
          </div>
        </div>

        {selected && (
          <p className="mt-3 text-xs text-muted-foreground">
            Selling for <strong>GHS {Number(selected.price_ghs).toFixed(2)}</strong> ·
            cost GHS {Number(selected.cost_price_ghs ?? 0).toFixed(2)} ·
            profit GHS {(Number(selected.price_ghs) - Number(selected.cost_price_ghs ?? 0)).toFixed(2)}
          </p>
        )}

        <div className="mt-4">
          <Button
            onClick={submit}
            disabled={busy}
            size="lg"
            className="w-full md:w-auto bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {busy ? "Sending…" : "Fulfill now"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
