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
import { Info } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/orders.functions";
import { payAndFulfill } from "@/lib/checkout.functions";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { NetworkBadge } from "./status-badge";

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
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const create = useServerFn(createOrder);
  const pay = useServerFn(payAndFulfill);
  const navigate = useNavigate();

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
      const result = await pay({ data: { orderId } });
      if (result.status === "delivered") {
        toast.success("Bundle delivered!");
      } else if (result.status === "failed") {
        toast.error("Delivery failed — try again or contact support");
      } else {
        toast.message("Order recorded");
      }
      onOpenChange(false);
      setPhone("");
      navigate({ to: "/orders/$orderId", params: { orderId } });
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
            GHS {Number(bundle.price_ghs).toFixed(2)} · {bundle.validity}
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Test checkout mode — real card payments unlock once Paystack approves the account.
          </AlertDescription>
        </Alert>
        <div className="space-y-2">
          <Label htmlFor="phone">Recipient phone number</Label>
          <Input
            id="phone"
            placeholder="0241234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? "Processing..." : "Confirm (Test)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
