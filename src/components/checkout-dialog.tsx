// checkout-dialog.tsx
// Patch 2 — All emojis replaced with Lucide icons (AlertTriangle, ShieldAlert, etc.)
// Patch 6 (baked in) — SIM restriction warning panel added above the CTA.
//   This protects the business from refund liability on Turbonet, Merchant EVD,
//   Blacklisted, Roaming, Inactive, and Wrong-number SIMs — the same restrictions
//   prominently displayed on MyDataBundles.

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button }  from "@/components/ui/button";
import { Input }   from "@/components/ui/input";
import { Label }   from "@/components/ui/label";
import {
  Info, X, Zap, ShieldAlert, AlertTriangle,
  WifiOff, MapPin, Ban, PhoneOff, SmartphoneNfc,
} from "lucide-react";
import { useServerFn }               from "@tanstack/react-start";
import { createOrder }               from "@/lib/orders.functions";
import { createPaystackTransaction } from "@/lib/checkout.functions";
import { toast }                     from "sonner";
import { useNavigate }               from "@tanstack/react-router";
import { NetworkBadge }              from "./status-badge";
import { useAuth }                   from "@/hooks/use-auth";
import { useSavedPhones }            from "@/hooks/use-saved-phones";

type Bundle = {
  id: string; network: string; name: string;
  data_mb: number; price_ghs: number; validity: string;
};

// ── Restriction items — no emojis, all Lucide icons ──────────────────────────
const RESTRICTIONS = [
  { Icon: SmartphoneNfc, label: "Turbonet SIMs",       note: "Not compatible"        },
  { Icon: Ban,           label: "Merchant / EVD SIMs",  note: "Will be burnt"         },
  { Icon: WifiOff,       label: "Broadband SIMs",       note: "Not compatible"        },
  { Icon: ShieldAlert,   label: "Blacklisted numbers",  note: "Irreversible — no refund" },
  { Icon: MapPin,        label: "Roaming numbers",      note: "Must be in Ghana"      },
  { Icon: PhoneOff,      label: "Inactive SIMs",        note: "Must be active 30+ days" },
];

export function CheckoutDialog({
  bundle, open, onOpenChange,
}: {
  bundle: Bundle | null; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const { user } = useAuth();
  const [phone,         setPhone]         = useState("");
  const [email,         setEmail]         = useState("");
  const [busy,          setBusy]          = useState(false);
  const [warningRead,   setWarningRead]   = useState(false);

  const create   = useServerFn(createOrder);
  const initPay  = useServerFn(createPaystackTransaction);
  const navigate = useNavigate();
  const { phones, remember, forget } = useSavedPhones();

  if (!bundle) return null;

  const gbLabel = (bundle.data_mb / 1024) % 1 === 0
    ? `${bundle.data_mb / 1024}`
    : (bundle.data_mb / 1024).toFixed(1);

  const onConfirm = async () => {
    if (!warningRead) {
      toast.error("Please read and acknowledge the SIM restrictions first.");
      return;
    }
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

      const callbackUrl = `${window.location.origin}/track/${orderId}`;
      const payResult = await initPay({
        data: {
          orderId,
          email: email.trim() || (user?.email ?? ""),
          callbackUrl,
        },
      });

      onOpenChange(false);
      setPhone("");
      setEmail("");
      setWarningRead(false);
      window.location.href = payResult.authorizationUrl;
    } catch (e: any) {
      toast.error(e?.message ?? "Checkout failed — please try again");
    } finally {
      setBusy(false);
    }
  };

  // Reset warning state whenever dialog opens fresh
  const handleOpenChange = (o: boolean) => {
    if (!o) { setWarningRead(false); setPhone(""); setEmail(""); }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 gap-0 border-0"
        style={{
          background:           "rgba(13, 17, 23, 0.95)",
          backdropFilter:       "blur(32px) saturate(1.6)",
          WebkitBackdropFilter: "blur(32px) saturate(1.6)",
          border:               "1px solid rgba(0,255,255,0.12)",
          boxShadow:            "0 24px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.06)",
          borderRadius:         "24px",
          maxHeight:            "92svh",
          overflowY:            "auto",
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
              {gbLabel} GB &middot; GHS {Number(bundle.price_ghs).toFixed(2)} &middot; {bundle.validity} &middot; delivered to any Ghana number
            </DialogDescription>
          </DialogHeader>

          {/* ── Info panel ── */}
          <div
            className="flex items-start gap-3 rounded-xl px-4 py-3"
            style={{
              background: "rgba(0,102,255,0.10)",
              border:     "1px solid rgba(0,102,255,0.20)",
            }}
          >
            <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#00ffff" }} />
            <p className="text-xs text-white/70 leading-relaxed">
              You&apos;ll be redirected to Paystack to complete payment securely.
              Your data will be delivered automatically after payment confirmation.
            </p>
          </div>

          {/* ── SIM RESTRICTION WARNING (Patch 6) ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(239,68,68,0.06)",
              border:     "1.5px solid rgba(239,68,68,0.25)",
            }}
          >
            {/* Header row */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(239,68,68,0.15)" }}
            >
              <span
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  width:          "26px",
                  height:         "26px",
                  borderRadius:   "50%",
                  background:     "rgba(239,68,68,0.15)",
                  flexShrink:     0,
                }}
              >
                <AlertTriangle style={{ width: "13px", height: "13px", color: "#ef4444" }} />
              </span>
              <span
                style={{
                  fontFamily:    "var(--font-heading)",
                  fontWeight:    700,
                  fontSize:      "0.80rem",
                  color:         "#fca5a5",
                  letterSpacing: "0.02em",
                }}
              >
                SIM Restrictions — read before paying
              </span>
            </div>

            {/* Restriction grid */}
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
              {RESTRICTIONS.map(({ Icon, label, note }) => (
                <div
                  key={label}
                  className="flex items-start gap-2"
                >
                  <span
                    style={{
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      width:          "20px",
                      height:         "20px",
                      borderRadius:   "50%",
                      background:     "rgba(239,68,68,0.10)",
                      flexShrink:     0,
                      marginTop:      "1px",
                    }}
                  >
                    <Icon style={{ width: "10px", height: "10px", color: "#f87171" }} />
                  </span>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 600,
                        fontSize:   "0.68rem",
                        color:      "rgba(255,255,255,0.85)",
                        lineHeight: 1.3,
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize:   "0.62rem",
                        color:      "rgba(255,255,255,0.45)",
                        lineHeight: 1.3,
                        marginTop:  "1px",
                      }}
                    >
                      {note}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div
              className="px-4 pb-3"
            >
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize:   "0.68rem",
                  color:      "rgba(255,255,255,0.45)",
                  lineHeight: 1.55,
                }}
              >
                Data sent to restricted SIMs is <strong style={{ color: "#fca5a5" }}>burnt and irreversible</strong>.
                Eli Data Resales cannot refund orders placed on restricted numbers.
                Verify your SIM type before proceeding.
              </p>
            </div>

            {/* Acknowledgement checkbox */}
            <div
              className="flex items-center gap-3 px-4 pb-4 pt-1"
              style={{ borderTop: "1px solid rgba(239,68,68,0.12)" }}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={warningRead}
                onClick={() => setWarningRead((v) => !v)}
                style={{
                  width:          "20px",
                  height:         "20px",
                  borderRadius:   "6px",
                  border:         warningRead
                    ? "2px solid #22c55e"
                    : "2px solid rgba(255,255,255,0.20)",
                  background:     warningRead ? "#22c55e" : "rgba(255,255,255,0.04)",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  flexShrink:     0,
                  cursor:         "pointer",
                  transition:     "background 0.2s, border-color 0.2s",
                }}
              >
                {warningRead && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4.5L4 7.5L10 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize:   "0.72rem",
                  color:      warningRead ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.50)",
                  lineHeight: 1.5,
                  cursor:     "pointer",
                  transition: "color 0.2s",
                }}
                onClick={() => setWarningRead((v) => !v)}
              >
                I confirm my SIM is eligible and not on the restricted list above
              </p>
            </div>
          </div>

          {/* ── Phone input ── */}
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
                background: "rgba(255,255,255,0.06)",
                border:     "1px solid rgba(255,255,255,0.10)",
                color:      "#ffffff",
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
                      background: "rgba(0,102,255,0.12)",
                      border:     "1px solid rgba(0,255,255,0.15)",
                      color:      "rgba(255,255,255,0.75)",
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

          {/* ── Email input (guests only) ── */}
          {!user?.email && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Email <span className="text-white/30 font-normal normal-case">(for payment receipt)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="rounded-xl text-white placeholder:text-white/30"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border:     "1px solid rgba(255,255,255,0.10)",
                  color:      "#ffffff",
                }}
              />
            </div>
          )}

          <DialogFooter className="gap-2 pt-1">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
              className="rounded-full border-white/15 text-white/70 hover:bg-white/08 hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              Cancel
            </Button>
            <button
              onClick={onConfirm}
              disabled={busy || !warningRead}
              className="btn-electric sheen-btn relative overflow-hidden inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={!warningRead ? "Acknowledge restrictions first" : undefined}
            >
              <Zap className="h-4 w-4 relative z-10" />
              <span className="relative z-10">
                {busy ? "Preparing payment…" : `Pay GHS ${Number(bundle.price_ghs).toFixed(2)}`}
              </span>
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
