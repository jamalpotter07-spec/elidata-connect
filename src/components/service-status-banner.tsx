// service-status-banner.tsx
// Patch 4 + Patch 5 — Combined working hours notice + USSD code display.
//
// Patch 4: Prominently shows the USSD balance-check codes for all three networks
//          so customers know how to verify delivery without contacting support.
//          MyDataBundles shows *426*143# on every page — we do the same pattern
//          but network-specific since we serve MTN, Telecel, and AT.
//
// Patch 5: Shows a real-time "orders placed after 11 PM processed next morning"
//          notice based on Ghana time (UTC+0). The banner has three states:
//            • "Open" (6 AM – 10:45 PM GMT) — green, instant delivery
//            • "Closing soon" (10:45 PM – 11 PM GMT) — amber warning
//            • "After hours" (11 PM – 6 AM GMT) — red, next morning notice
//          Uses the existing LiveClock component for the animated clock icon.

import { useEffect, useState } from "react";
import { Clock, Wifi, CheckCircle2, AlertTriangle, Moon } from "lucide-react";
import { LiveClock } from "./live-clock";

// ── Ghana time helpers (UTC+0 = GMT, no DST) ─────────────────────────────────
function getGhanaHourMinute(): { hour: number; minute: number } {
  // Ghana is always UTC+0 — no DST adjustment needed.
  const now = new Date();
  return {
    hour:   now.getUTCHours(),
    minute: now.getUTCMinutes(),
  };
}

type ServiceState = "open" | "closing_soon" | "after_hours";

function getServiceState(): ServiceState {
  const { hour, minute } = getGhanaHourMinute();
  const totalMinutes = hour * 60 + minute;
  const OPEN_START   = 6  * 60;       // 06:00
  const WARN_START   = 22 * 60 + 45;  // 22:45
  const CLOSE_START  = 23 * 60;       // 23:00

  if (totalMinutes >= CLOSE_START || totalMinutes < OPEN_START) return "after_hours";
  if (totalMinutes >= WARN_START)  return "closing_soon";
  return "open";
}

function formatGhanaTime(): string {
  const { hour, minute } = getGhanaHourMinute();
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

// ── USSD code data ────────────────────────────────────────────────────────────
const USSD_CODES = [
  { network: "MTN",     code: "*124#", color: "#e6b800", bg: "#111111" },
  { network: "Telecel", code: "*110#", color: "#ffffff", bg: "#E30613" },
  { network: "AT",      code: "*100#", color: "#ffffff", bg: "linear-gradient(135deg,#E30613,#002868)" },
] as const;

// ── Main component ─────────────────────────────────────────────────────────────
export function ServiceStatusBanner() {
  const [state,     setState]     = useState<ServiceState>(getServiceState);
  const [timeStr,   setTimeStr]   = useState(formatGhanaTime);
  const [dismissed, setDismissed] = useState(false);

  // Refresh every 30 seconds — cheap enough, catches the 22:45 transition
  useEffect(() => {
    const t = setInterval(() => {
      setState(getServiceState());
      setTimeStr(formatGhanaTime());
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  if (dismissed) return null;

  // ── Shared card styles ────────────────────────────────────────────────────
  const cardBase: React.CSSProperties = {
    borderRadius:         "20px",
    overflow:             "hidden",
    backdropFilter:       "blur(12px) saturate(1.4)",
    WebkitBackdropFilter: "blur(12px) saturate(1.4)",
    marginBottom:         "20px",
    animation:            "slide-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
  };

  // ── Status-specific colours ──────────────────────────────────────────────
  const stateConfig = {
    open: {
      bg:          "rgba(34,197,94,0.06)",
      border:      "1px solid rgba(34,197,94,0.18)",
      accentColor: "#16a34a",
      accentBg:    "rgba(34,197,94,0.10)",
      Icon:        CheckCircle2,
      title:       "Instant delivery — lines are open",
      message:     `Orders processed in under 60 seconds. Open until 11 PM Ghana time (currently ${timeStr}).`,
    },
    closing_soon: {
      bg:          "rgba(245,158,11,0.06)",
      border:      "1px solid rgba(245,158,11,0.22)",
      accentColor: "#d97706",
      accentBg:    "rgba(245,158,11,0.10)",
      Icon:        AlertTriangle,
      title:       "Closing soon — order before 11 PM",
      message:     `It's ${timeStr} in Ghana. Orders placed after 11 PM will be processed first thing next morning.`,
    },
    after_hours: {
      bg:          "rgba(239,68,68,0.05)",
      border:      "1px solid rgba(239,68,68,0.18)",
      accentColor: "#dc2626",
      accentBg:    "rgba(239,68,68,0.08)",
      Icon:        Moon,
      title:       "After-hours — orders processed at 6 AM",
      message:     `It's ${timeStr} in Ghana. Orders placed now will be delivered first thing in the morning. You can still order — payment is secure.`,
    },
  };

  const cfg = stateConfig[state];

  return (
    <div style={{ ...cardBase, background: cfg.bg, border: cfg.border }}>

      {/* ── Status header ── */}
      <div
        className="flex items-start justify-between gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-start gap-3 min-w-0">
          {/* Animated clock icon (uses LiveClock SVG) */}
          <span
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          "34px",
              height:         "34px",
              borderRadius:   "50%",
              background:     cfg.accentBg,
              flexShrink:     0,
              color:          cfg.accentColor,
            }}
          >
            <LiveClock className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <p
              style={{
                fontFamily:  "var(--font-heading)",
                fontWeight:  700,
                fontSize:    "0.80rem",
                color:       cfg.accentColor,
                lineHeight:  1.3,
                marginBottom: "3px",
              }}
            >
              {cfg.title}
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize:   "0.72rem",
                color:      "var(--muted-foreground)",
                lineHeight: 1.5,
              }}
            >
              {cfg.message}
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss notice"
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            width:          "22px",
            height:         "22px",
            borderRadius:   "50%",
            background:     "rgba(0,0,0,0.06)",
            border:         "none",
            cursor:         "pointer",
            flexShrink:     0,
            color:          "var(--muted-foreground)",
            fontSize:       "0.75rem",
            lineHeight:     1,
            marginTop:      "2px",
          }}
        >
          ×
        </button>
      </div>

      {/* ── USSD balance check codes (Patch 4) ── */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Wifi style={{ width: "11px", height: "11px", color: "var(--muted-foreground)" }} strokeWidth={2} />
          <span
            style={{
              fontFamily:    "var(--font-eyebrow)",
              fontSize:      "0.60rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color:         "var(--muted-foreground)",
            }}
          >
            Check balance after delivery
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {USSD_CODES.map(({ network, code, color, bg }) => (
            <div
              key={network}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              {/* Network dot */}
              <span
                style={{
                  display:      "inline-flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  width:        "18px",
                  height:       "18px",
                  borderRadius: "50%",
                  background:   bg,
                  flexShrink:   0,
                }}
              >
                <span
                  style={{
                    fontFamily:    "var(--font-heading)",
                    fontWeight:    900,
                    fontSize:      "0.38rem",
                    color,
                    letterSpacing: "0",
                    lineHeight:    1,
                  }}
                >
                  {network === "AT" ? "AT" : network.slice(0, 3)}
                </span>
              </span>
              <code
                style={{
                  fontFamily:  "monospace",
                  fontWeight:  700,
                  fontSize:    "0.78rem",
                  color:       "var(--foreground)",
                  letterSpacing: "0.02em",
                }}
              >
                {code}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
