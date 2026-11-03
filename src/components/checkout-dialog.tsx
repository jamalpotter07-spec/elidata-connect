// checkout-dialog.tsx
// Short and calm: the bundle, a phone number, Pay.
// The SIM notice only appears for a new number (first purchase, or a number not
// bought for before on this device). A returning number skips it.

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/orders.functions";
import { createPaystackTransaction } from "@/lib/checkout.functions";
import { toast } from "sonner";
import { NetworkBadge } from "./status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useSavedPhones } from "@/hooks/use-saved-phones";

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
};

const PHONE_RE = /^0\d{9}$/;

// Digits only; turns +233 / 233 numbers into the 0XXXXXXXXX form.
function cleanPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("233") && d.length > 9) d = "0" + d.slice(3);
  return d.slice(0, 10);
}

export function CheckoutDialog({
  bundle, open, onOpenChange,
}: {
  bundle: Bundle | null; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  // The number the customer ticked the SIM notice for. Changing the number clears it.
  const [ackFor, setAckFor] = useState("");

  const create = useServerFn(createOrder);
  const initPay = useServerFn(createPaystackTransaction);
  const { phones, remember } = useSavedPhones();

  if (!bundle) return null;

  const gbLabel = (bundle.data_mb / 1024) % 1 === 0
    ? `${bundle.data_mb / 1024}`
    : (bundle.data_mb / 1024).toFixed(1);

  const valid = PHONE_RE.test(phone);
  const isKnown = phones.includes(phone);
  // First purchase: show at once. Later purchases: only once a new full number is typed.
  const showNotice = !isKnown && (phones.length === 0 || valid);
  const acknowledged = ackFor !== "" && ackFor === phone;
  const canPay = valid && (isKnown || acknowledged) && !busy;

  const reset = () => { setPhone(""); setEmail(""); setAckFor(""); };

  const onConfirm = async () => {
    if (!canPay) return;
    setBusy(true);
    try {
      const { orderId } = await create({
        data: { bundleId: bundle.id, recipientPhone: phone },
      });
      remember(phone);

      const payResult = await initPay({
        data: {
          orderId,
          email: email.trim() || (user?.email ?? ""),
          callbackUrl: `${window.location.origin}/track/${orderId}`,
        },
      });

      onOpenChange(false);
      reset();
      window.location.href = payResult.authorizationUrl;
    } catch (e: any) {
      toast.error(e?.message ?? "Payment could not start. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92svh] w-[calc(100vw-1.5rem)] max-w-md gap-0 overflow-y-auto p-0">
        <DialogHeader className="space-y-2 p-6 pb-4 pr-16 text-left">
          <div>
            <NetworkBadge network={bundle.network} />
          </div>
          <DialogTitle className="font-display text-3xl font-semibold leading-none">{gbLabel} GB</DialogTitle>
          <DialogDescription className="text-xl font-semibold text-foreground">
            GHS {Number(bundle.price_ghs).toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5 px-6 pb-6"
          onSubmit={(e) => { e.preventDefault(); onConfirm(); }}
        >
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base">Phone number</Label>
            <Input
              id="phone"
              placeholder="0241234567"
              value={phone}
              onChange={(e) => setPhone(cleanPhone(e.target.value))}
              inputMode="numeric"
              autoComplete="tel"
            />
            {phone.length > 0 && !valid && phone.length >= 10 && (
              <p className="text-sm text-danger">Use a 10-digit number starting with 0.</p>
            )}
            {phones.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-sm text-muted-foreground">Recent</span>
                {phones.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPhone(p)}
                    className="min-h-10 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Email (guests only) */}
          {!user?.email && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email for your receipt</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          )}

          {/* SIM notice: new numbers only */}
          {showNotice && (
            <div className="rounded-2xl border border-border bg-muted p-4">
              <p className="text-base font-semibold text-foreground">Before you pay</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base leading-snug text-muted-foreground">
                <li>Turbonet, broadband and merchant (EVD) SIMs are not supported.</li>
                <li>The number must be active for 30+ days and in Ghana, not roaming.</li>
                <li>Data sent to a restricted or blacklisted number is lost. We cannot refund it.</li>
              </ul>
              <label
                htmlFor="sim-ok"
                className={`mt-4 flex min-h-11 items-center gap-3 text-base text-foreground ${valid ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              >
                <Checkbox
                  id="sim-ok"
                  checked={acknowledged}
                  disabled={!valid}
                  onCheckedChange={(v) => setAckFor(v === true ? phone : "")}
                />
                My number is not on this list
              </label>
            </div>
          )}

          <button type="submit" disabled={!canPay} className="btn-orange w-full" style={{ minHeight: 52 }}>
            {busy ? "Please wait" : `Pay GHS ${Number(bundle.price_ghs).toFixed(2)}`}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
