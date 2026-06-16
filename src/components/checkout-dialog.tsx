import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, X, Zap } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { createOrder }   from "@/lib/orders.functions";
import { payAndFulfill } from "@/lib/checkout.functions";
import { toast }          from "sonner";
import { useNavigate }    from "@tanstack/react-router";
import { NetworkBadge }   from "./status-badge";
import { useAuth }        from "@/hooks/use-auth";
import { useSavedPhones } from "@/hooks/use-saved-phones";

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
};

export function CheckoutDialog({
  bundle, open, onOpenChange,
}: {
  bundle: Bundle | null; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [busy,  setBusy]  = useState(false);
  const create   = useServerFn(createOrder);
  const pay      = useServerFn(payAndFulfill);
  const navigate = useNavigate();
  const { phones, remember, forget } = useSavedPhones();

  if (!bundle) return null;

  const gbLabel = (bundle.data_mb / 1024) % 1 === 0
    ? `${bundle.data_mb / 1024}`
    : (bundle.data_mb / 1024).toFixed(1);

  const onConfirm = async () => {
    if (!/^0\d{9}$/.test(phone.trim())) {
      toast.error("Enter a valid 10-digit Ghana phone number");
      return;
    }
    setBusy(true);
    try {
      const { orderId } = await create({ data: { bundleId: bundle.id, recipientPhone: phone.trim() } });
      remember(phone.trim());
      pay({ data: { orderId } }).catch(() => {});
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
      <DialogContent className="overflow-hidden p-0 gap-0 border-0"
        style={{
          background:           "rgba(13, 17, 23, 0.95)",
          backdropFilter:       "blur(32px) saturate(1.6)",
          WebkitBackdropFilter: "blur(32px) saturate(1.6)",
          border:               "1px solid rgba(0,255,255,0.12)",
          boxShadow:            "0 24px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.06)",
          borderRadius:         "24px",
        }}
      >
        {/* Electric top bar */}
        <div style={{ background: "linear-gradient(90deg, #0066ff, #00ffff)", height: "3px" }} />

        <div className="p-6 space-y-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <NetworkBadge network={bundle.network} />
              <span style={{ fontFamily: "var(--font-display)" }}>{bundle.name}</span>
            </DialogTitle>
            <DialogDescription className="text-white/55">
              {gbLabel} GB · GHS {Number(bundle.price_ghs).toFixed(2)} · {bundle.validity} · delivered to any Ghana number
            </DialogDescription>
          </DialogHeader>

          {/* Info alert — glass tinted */}
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: "rgba(0,102,255,0.10)",
              border:     "1px solid rgba(0,102,255,0.20)",
            }}
          >
            <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#00ffff" }} />
            <p className="text-xs text-white/70 leading-relaxed">
              No account needed. We'll send the data directly to the number below.
            </p>
          </div>

          {/* Phone input */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Recipient phone number
            </Label>
            <Input
              id="phone"
              placeholder="0241234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
              autoComplete="tel"
              className="rounded-xl text-white placeholder:text-white/30"
              style={{
                background:   "rgba(255,255,255,0.06)",
                border:       "1px solid rgba(255,255,255,0.10)",
                color:        "#ffffff",
              }}
            />
            {phones.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-1.5">
                <span className="text-[11px] text-white/35 self-center mr-1">Recent:</span>
                {phones.map((p) => (
                  <span
                    key={p}
                    className="group inline-flex items-center gap-1 rounded-full pl-2.5 pr-1.5 py-1 text-xs cursor-pointer transition-colors"
                    style={{
                      background:   "rgba(0,102,255,0.12)",
                      border:       "1px solid rgba(0,255,255,0.15)",
                      color:        "rgba(255,255,255,0.75)",
                    }}
                    onClick={() => setPhone(p)}
                  >
                    {p}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); forget(p); }}
                      className="opacity-50 hover:opacity-100 ml-0.5"
                      aria-label={`Forget ${p}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              variant="outline" onClick={() => onOpenChange(false)} disabled={busy}
              className="rounded-full border-white/15 text-white/70 hover:bg-white/08 hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              Cancel
            </Button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className="btn-electric sheen-btn relative overflow-hidden inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Zap className="h-4 w-4 relative z-10" />
              <span className="relative z-10">
                {busy ? "Placing order…" : `Pay GHS ${Number(bundle.price_ghs).toFixed(2)}`}
              </span>
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
