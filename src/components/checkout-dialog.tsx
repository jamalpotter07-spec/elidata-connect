import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/orders.functions";
import { payAndFulfill } from "@/lib/checkout.functions";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { NetworkBadge } from "./status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useSavedPhones } from "@/hooks/use-saved-phones";

type Bundle = {
  id: string;
  network: string;
  name: string;
  data_mb: number;
  price_ghs: number;
  validity: string;
};

export function CheckoutDialog({
  bundle,
  open,
  onOpenChange,
}: {
  bundle: Bundle | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createOrder);
  const pay = useServerFn(payAndFulfill);
  const navigate = useNavigate();
  const { phones, remember, forget } = useSavedPhones();

  if (!bundle) return null;

  const onConfirm = async () => {
    if (!/^0\d{9}$/.test(phone.trim())) {
      toast.error("Enter a valid 10-digit Ghana phone number");
      return;
    }
    setBusy(true);
    try {
      const { orderId } = await create({
        data: { bundleId: bundle.id, recipientPhone: phone.trim() },
      });
      remember(phone.trim());

      // Fire-and-forget — don't make customer wait on the slow reseller API.
      // The tracking page polls and updates the moment delivery completes.
      pay({ data: { orderId } }).catch(() => {
        // Errors will surface on the tracking page via order status.
      });

      toast.success("Order received — taking you to live tracking");
      onOpenChange(false);
      setPhone("");
      navigate({ to: user ? "/orders/$orderId" : "/track/$orderId", params: { orderId } });
    } catch (e: any) {
      toast.error(e?.message ?? "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NetworkBadge network={bundle.network} /> {bundle.name}
          </DialogTitle>
          <DialogDescription>
            GHS {Number(bundle.price_ghs).toFixed(2)} · {bundle.validity} · delivered to any Ghana number
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No account needed. We'll send the data to the number below.
          </AlertDescription>
        </Alert>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="phone">Recipient phone number</Label>
            <Input
              id="phone"
              placeholder="0241234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              autoComplete="tel"
            />
            {phones.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                <span className="text-[11px] text-muted-foreground self-center mr-1">Recent:</span>
                {phones.map((p) => (
                  <span
                    key={p}
                    className="group inline-flex items-center gap-1 rounded-full border bg-muted/40 pl-2 pr-1 py-0.5 text-xs hover:bg-accent cursor-pointer"
                    onClick={() => setPhone(p)}
                  >
                    {p}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); forget(p); }}
                      className="opacity-50 hover:opacity-100"
                      aria-label={`Forget ${p}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? "Placing..." : `Pay GHS ${Number(bundle.price_ghs).toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
