// checkout-dialog.tsx
// Bundle summary, phone number, Continue. Paystack is the only way to pay.
// - Numbers are forgiving: +233, 233, 00233, no leading 0, spaces and dashes all work.
// - Network check: warns when the number's prefix belongs to another network,
//   unless the customer says the number is ported.
// - SIM notice: only for a first purchase or a number not bought for before on this device.
// - Problems show as one quiet line inside the card, never as pop-ups.

import { useState } from "react";
import { Phone } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/orders.functions";
import { createPaystackTransaction } from "@/lib/checkout.functions";
import { NetworkBadge } from "./status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useSavedPhones } from "@/hooks/use-saved-phones";

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
};
type Net = "MTN" | "Telecel" | "AT";

const PHONE_RE = /^0\d{9}$/;

// Ghana mobile prefixes by network.
const PREFIXES: Record<Net, string[]> = {
  MTN: ["024", "025", "053", "054", "055", "059"],
  Telecel: ["020", "050"],
  AT: ["026", "027", "056", "057"],
};
const NET_LABEL: Record<Net, string> = { MTN: "MTN", Telecel: "Telecel", AT: "Airtel-Tigo" };

function networkOfNumber(phone: string): Net | null {
  const p = phone.slice(0, 3);
  return (Object.keys(PREFIXES) as Net[]).find((n) => PREFIXES[n].includes(p)) ?? null;
}

// Accepts 0241234567, 241234567, 233241234567, +233 24 123 4567, 00233..., (024) 123-4567 ...
// and returns the 10-digit 0XXXXXXXXX form (or whatever has been typed so far).
function normalizePhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("00233")) d = d.slice(5);
  else if (d.startsWith("233")) d = d.slice(3);
  if (d === "") return "";
  if (!d.startsWith("0")) d = "0" + d;
  return d.slice(0, 10);
}

export function CheckoutDialog({
  bundle, open, onOpenChange,
}: {
  bundle: Bundle | null; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Ticks are tied to the number they were given for. Changing the number clears them.
  const [simOkFor, setSimOkFor] = useState("");
  const [portedFor, setPortedFor] = useState("");

  const create = useServerFn(createOrder);
  const initPay = useServerFn(createPaystackTransaction);
  const { phones, remember } = useSavedPhones();

  if (!bundle) return null;

  const gbLabel = (bundle.data_mb / 1024) % 1 === 0
    ? `${bundle.data_mb / 1024}`
    : (bundle.data_mb / 1024).toFixed(1);

  const phone = normalizePhone(raw);
  const valid = PHONE_RE.test(phone);
  const isKnown = phones.includes(phone);

  // Network check
  const bundleNet = bundle.network as Net;
  const detected = valid ? networkOfNumber(phone) : null;
  const mismatch = valid && detected !== null && detected !== bundleNet;
  const ported = portedFor !== "" && portedFor === phone;
  const networkOk = !mismatch || ported;

  // SIM notice: first purchase shows at once; later only when a new full number is typed.
  const showNotice = !isKnown && (phones.length === 0 || valid);
  const simOk = simOkFor !== "" && simOkFor === phone;

  const canPay = valid && networkOk && (isKnown || simOk) && !busy;

  const reset = () => {
    setRaw(""); setSimOkFor(""); setPortedFor(""); setError("");
  };

  const onConfirm = async () => {
    if (!canPay) return;
    setBusy(true);
    setError("");
    try {
      const { orderId } = await create({
        data: { bundleId: bundle.id, recipientPhone: phone },
      });
      remember(phone);

      const payResult = await initPay({
        data: {
          orderId,
          email: user?.email ?? "",
          callbackUrl: `${window.location.origin}/track/${orderId}`,
        },
      });

      onOpenChange(false);
      reset();
      window.location.href = payResult.authorizationUrl;
    } catch (e) {
      console.error("Checkout failed", e);
      setError("We could not start the payment. Please try again, or message us on WhatsApp.");
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
        <div className="p-6 pb-3 pr-16">
          <DialogTitle className="text-base font-medium leading-snug text-muted-foreground">
            Enter the number to send it to.
          </DialogTitle>
          <DialogDescription className="sr-only">
            {gbLabel} GB {NET_LABEL[bundleNet] ?? bundle.network} for GHS {Number(bundle.price_ghs).toFixed(2)}
          </DialogDescription>
        </div>

        <form
          className="space-y-4 px-6 pb-6"
          onSubmit={(e) => { e.preventDefault(); onConfirm(); }}
        >
          {/* Bundle summary */}
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-4">
            <div className="flex flex-col items-start gap-1.5">
              <NetworkBadge network={bundle.network} />
              <span className="font-display text-2xl font-semibold leading-none text-foreground">{gbLabel} GB</span>
            </div>
            <span className="text-xl font-semibold text-foreground">
              GHS {Number(bundle.price_ghs).toFixed(2)}
            </span>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                aria-label="Phone number"
                placeholder="024 123 4567"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                onBlur={() => { if (valid) setRaw(phone); }}
                inputMode="tel"
                autoComplete="tel"
                className="pl-12"
              />
            </div>

            {phone.length >= 10 && !valid && (
              <p className="text-sm text-danger" role="alert">Check the number. It should be 10 digits.</p>
            )}

            {phones.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-sm text-muted-foreground">Recent</span>
                {phones.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setRaw(p)}
                    className="min-h-10 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Network check */}
          {mismatch && detected && (
            <div className="space-y-1 text-base">
              <p className="text-foreground" role="alert">
                This looks like a {NET_LABEL[detected]} number. You picked {NET_LABEL[bundleNet]} data.
              </p>
              <label
                htmlFor="ported"
                className="flex min-h-11 cursor-pointer items-center gap-3 text-muted-foreground"
              >
                <Checkbox
                  id="ported"
                  checked={ported}
                  onCheckedChange={(v) => setPortedFor(v === true ? phone : "")}
                />
                Number is ported (skip the network check)
              </label>
            </div>
          )}

          {/* SIM notice: new numbers only */}
          {showNotice && (
            <div className="rounded-2xl border border-border p-4">
              <p className="text-base font-semibold text-foreground">Before you pay</p>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-base leading-snug text-muted-foreground">
                <li>Turbonet, broadband and merchant (EVD) SIMs are not supported.</li>
                <li>The number must be active for 30+ days and in Ghana, not roaming.</li>
                <li>Data sent to a restricted or blacklisted number is lost. We cannot refund it.</li>
              </ul>
              <label
                htmlFor="sim-ok"
                className={`mt-3 flex min-h-11 items-center gap-3 text-base text-foreground ${valid ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              >
                <Checkbox
                  id="sim-ok"
                  checked={simOk}
                  disabled={!valid}
                  onCheckedChange={(v) => setSimOkFor(v === true ? phone : "")}
                />
                My number is not on this list
              </label>
            </div>
          )}

          {error && (
            <p className="text-base text-danger" role="alert">{error}</p>
          )}

          <div className="space-y-3 pt-1">
            <p className="text-center text-sm text-muted-foreground">
              You'll be directed to Paystack to complete payment.
            </p>
            <button type="submit" disabled={!canPay} className="btn-orange w-full" style={{ minHeight: 52 }}>
              {busy ? "Please wait" : "Continue"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
