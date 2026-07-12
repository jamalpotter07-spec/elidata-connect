import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGuestOrder } from "@/lib/orders.functions";
import { NavBar } from "@/components/nav-bar";
import {
  CheckCircle2, Clock, Loader2, MessageCircle,
  ChevronRight, Copy, Check, PackageCheck, PackageX,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";

export const Route = createFileRoute("/track/$orderId")({
  component: TrackPage,
  head: () => ({ meta: [{ title: "Track your order — Eli Data Resales" }] }),
});

const STEPS = [
  { key: "pending",    label: "Order received",     desc: "Awaiting payment confirmation" },
  { key: "paid",       label: "Sent to network",    desc: "Forwarding to carrier"         },
  { key: "processing", label: "Carrier processing", desc: "Usually takes 30s–3 min"       },
  { key: "delivered",  label: "Delivered",          desc: "Data is live on your phone"    },
] as const;

function stepIndex(status: string) {
  if (status === "delivered")  return 3;
  if (status === "processing") return 2;
  if (status === "paid")       return 1;
  return 0;
}

function NetworkPill({ network }: { network: string }) {
  const styles: Record<string, React.CSSProperties> = {
    MTN:     { background: "#111111", color: "#e6b800" },
    Telecel: { background: "#E30613", color: "#ffffff" },
    AT:      { background: "linear-gradient(90deg,#E30613,#002868)", color: "#ffffff" },
  };
  const s = styles[network] ?? { background: "#333", color: "#fff" };
  return (
    <span
      style={{
        ...s,
        fontFamily:    "var(--font-heading)",
        fontWeight:    900,
        fontSize:      "0.68rem",
        letterSpacing: "0.06em",
        padding:       "3px 12px",
        borderRadius:  "9999px",
        display:       "inline-flex",
        alignItems:    "center",
      }}
    >
      {network === "AT" ? "Airtel-Tigo" : network}
    </span>
  );
}

// Copy-to-clipboard button — shows a tick for 2s after copy
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      onClick={handle}
      title="Copy order ID"
      aria-label="Copy full order ID"
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        width:          "28px",
        height:         "28px",
        borderRadius:   "50%",
        border:         "1.5px solid rgba(0,0,0,0.10)",
        background:     copied ? "rgba(34,197,94,0.08)" : "#ffffff",
        cursor:         "pointer",
        transition:     "background 0.2s, border-color 0.2s",
        flexShrink:     0,
      }}
    >
      {copied
        ? <Check style={{ width: "12px", height: "12px", color: "#16a34a" }} />
        : <Copy  style={{ width: "12px", height: "12px", color: "#888888" }} />}
    </button>
  );
}

function TrackPage() {
  const { orderId } = Route.useParams();
  const fn = useServerFn(getGuestOrder);

  const { data, isLoading } = useQuery({
    queryKey: ["track", orderId],
    queryFn:  () => fn({ data: { orderId } }),
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.order?.status;
      return s === "delivered" || s === "failed" || s === "refunded" ? false : 2500;
    },
  });

  const order     = data?.order as any;
  const status    = order?.status ?? "pending";
  const active    = stepIndex(status);
  const failed    = status === "failed";
  const delivered = status === "delivered";
  const gbLabel   = order
    ? ((order.data_mb / 1024) % 1 === 0
        ? `${order.data_mb / 1024}`
        : (order.data_mb / 1024).toFixed(1))
    : "—";

  // Elapsed timer (stopped once terminal status reached)
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!order || ["delivered", "failed", "refunded"].includes(order.status)) return;
    const start = new Date(order.created_at).getTime();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [order]);

  const showSupportNudge = status === "pending" && elapsed >= 30;

  return (
    <>
      <NavBar />

      <main
        style={{
          minHeight:     "100svh",
          background:    "var(--background)",
          paddingTop:    "96px",
          paddingBottom: "100px",
        }}
      >
        <div className="mx-auto px-4" style={{ maxWidth: "480px" }}>

          {/* ── Page header ── */}
          <div style={{ marginBottom: "24px" }}>
            <p className="eyebrow mb-1">Live tracking</p>
            <h1
              style={{
                fontFamily:    "var(--font-hero)",
                fontWeight:    800,
                fontSize:      "1.6rem",
                letterSpacing: "-0.02em",
                color:         "var(--foreground)",
              }}
            >
              Order status
            </h1>
          </div>

          {isLoading || !order ? (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-3xl"
              style={{
                background: "#ffffff",
                border:     "1px solid rgba(0,0,0,0.07)",
                padding:    "48px 24px",
              }}
            >
              <Loader2
                style={{ width: "28px", height: "28px", color: "#e65100" }}
                className="animate-spin"
              />
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "#888" }}>
                Loading your order…
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">

              {/* ── Order summary card ── */}
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  background: "#ffffff",
                  border:     "1px solid rgba(0,0,0,0.07)",
                  boxShadow:  "0 2px 16px rgba(0,0,0,0.05)",
                }}
              >
                {/* Coloured top stripe */}
                <div
                  style={{
                    height:     "4px",
                    background: delivered
                      ? "linear-gradient(90deg,#22c55e,#16a34a)"
                      : failed
                        ? "linear-gradient(90deg,#ef4444,#dc2626)"
                        : "linear-gradient(90deg,#e65100,#f37d01)",
                  }}
                />

                <div className="p-5">
                  {/* Network + order ID row */}
                  <div className="flex items-center justify-between mb-3">
                    <NetworkPill network={order.network} />
                    {/* Order ID with copy button — replaces truncated plain text */}
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontFamily:    "var(--font-body)",
                          fontSize:      "0.7rem",
                          fontWeight:    600,
                          color:         "#aaaaaa",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <CopyButton text={order.id} />
                    </div>
                  </div>

                  {/* Data size */}
                  <div className="flex items-end gap-1 mb-1">
                    <span
                      style={{
                        fontFamily:    "var(--font-hero)",
                        fontWeight:    800,
                        fontSize:      "clamp(2.4rem, 10vw, 3rem)",
                        color:         "#111111",
                        lineHeight:    1,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {gbLabel}
                    </span>
                    <span
                      style={{
                        fontFamily:    "var(--font-hero)",
                        fontWeight:    700,
                        fontSize:      "1.1rem",
                        color:         "#111111",
                        paddingBottom: "4px",
                      }}
                    >
                      gb
                    </span>
                  </div>

                  {/* Recipient + amount */}
                  <div className="flex items-center justify-between mt-2">
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize:   "0.85rem",
                        color:      "#555",
                        fontWeight: 500,
                      }}
                    >
                      &rarr; {order.recipient_phone}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                        fontSize:   "0.9rem",
                        color:      "#111111",
                      }}
                    >
                      GHS {Number(order.amount_ghs).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Progress stepper ── */}
              {!failed && (
                <div
                  className="rounded-3xl p-5"
                  style={{
                    background: "#ffffff",
                    border:     "1px solid rgba(0,0,0,0.07)",
                    boxShadow:  "0 2px 16px rgba(0,0,0,0.05)",
                  }}
                >
                  <p
                    style={{
                      fontFamily:    "var(--font-eyebrow)",
                      fontSize:      "0.65rem",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color:         "#aaaaaa",
                      marginBottom:  "20px",
                    }}
                  >
                    Progress
                  </p>

                  <ol className="flex flex-col gap-0">
                    {STEPS.map((step, i) => {
                      const done    = i < active;
                      const current = i === active && !failed;
                      const future  = i > active;
                      const isLast  = i === STEPS.length - 1;

                      return (
                        <li key={step.key} className="flex gap-4">
                          {/* Dot + connector line */}
                          <div className="flex flex-col items-center" style={{ width: "20px", flexShrink: 0 }}>
                            <span
                              style={{
                                width:          "20px",
                                height:         "20px",
                                borderRadius:   "50%",
                                flexShrink:     0,
                                display:        "flex",
                                alignItems:     "center",
                                justifyContent: "center",
                                background:     done
                                  ? "#22c55e"
                                  : current
                                    ? "#e65100"
                                    : "rgba(0,0,0,0.08)",
                                transition: "background 0.3s",
                              }}
                            >
                              {done ? (
                                <CheckCircle2 style={{ width: "12px", height: "12px", color: "#fff" }} />
                              ) : current ? (
                                <Loader2 style={{ width: "11px", height: "11px", color: "#fff" }} className="animate-spin" />
                              ) : (
                                <Clock style={{ width: "11px", height: "11px", color: "#aaa" }} />
                              )}
                            </span>
                            {!isLast && (
                              <div
                                style={{
                                  width:        "2px",
                                  flex:         "1 1 0",
                                  minHeight:    "28px",
                                  background:   done ? "#22c55e" : "rgba(0,0,0,0.07)",
                                  marginTop:    "3px",
                                  marginBottom: "3px",
                                  borderRadius: "1px",
                                  transition:   "background 0.3s",
                                }}
                              />
                            )}
                          </div>

                          {/* Step label */}
                          <div style={{ paddingBottom: isLast ? 0 : "20px", paddingTop: "1px" }}>
                            <p
                              style={{
                                fontFamily: "var(--font-heading)",
                                fontWeight: current ? 700 : done ? 600 : 500,
                                fontSize:   "0.85rem",
                                color:      future ? "#bbbbbb" : "#111111",
                                lineHeight: 1.3,
                              }}
                            >
                              {step.label}
                            </p>
                            <p
                              style={{
                                fontFamily: "var(--font-body)",
                                fontSize:   "0.72rem",
                                color:      "#aaaaaa",
                                marginTop:  "2px",
                              }}
                            >
                              {step.desc}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {/* ── Status panel ── */}
              {delivered ? (
                /* SUCCESS — PackageCheck icon replaces ✅ emoji */
                <div
                  className="rounded-3xl p-5"
                  style={{
                    background: "rgba(34,197,94,0.06)",
                    border:     "1px solid rgba(34,197,94,0.20)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      style={{
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        width:          "28px",
                        height:         "28px",
                        borderRadius:   "50%",
                        background:     "rgba(34,197,94,0.12)",
                        flexShrink:     0,
                      }}
                    >
                      <PackageCheck style={{ width: "14px", height: "14px", color: "#16a34a" }} />
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                        fontSize:   "0.95rem",
                        color:      "#16a34a",
                      }}
                    >
                      Data delivered successfully
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#555", lineHeight: 1.6 }}>
                    Check your balance: dial{" "}
                    <code style={{ fontWeight: 700, color: "#111" }}>*124#</code> (MTN)
                    {" · "}<code style={{ fontWeight: 700, color: "#111" }}>*110#</code> (Telecel)
                    {" · "}<code style={{ fontWeight: 700, color: "#111" }}>*100#</code> (AT)
                  </p>
                </div>
              ) : failed ? (
                /* FAILED — PackageX icon replaces ❌ emoji */
                <div
                  className="rounded-3xl p-5"
                  style={{
                    background: "rgba(239,68,68,0.05)",
                    border:     "1px solid rgba(239,68,68,0.20)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      style={{
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        width:          "28px",
                        height:         "28px",
                        borderRadius:   "50%",
                        background:     "rgba(239,68,68,0.10)",
                        flexShrink:     0,
                      }}
                    >
                      <PackageX style={{ width: "14px", height: "14px", color: "#dc2626" }} />
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                        fontSize:   "0.95rem",
                        color:      "#dc2626",
                      }}
                    >
                      Delivery hit a snag
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.78rem", color: "#555", lineHeight: 1.6, marginBottom: "14px" }}>
                    {order.notes?.replace(/\[ip:[^\]]+\]/g, "").trim() || "The carrier rejected the request."}{" "}
                    We&apos;ve been notified and will retry or refund within minutes.
                  </p>
                  <a
                    href={`https://wa.me/233500843914?text=${encodeURIComponent(`Hi, my order ${order.id.slice(0, 8)} failed. Can you help?`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2"
                    style={{
                      background:     "#25D366",
                      color:          "#ffffff",
                      fontFamily:     "var(--font-heading)",
                      fontWeight:     700,
                      fontSize:       "0.8rem",
                      padding:        "9px 18px",
                      borderRadius:   "9999px",
                      textDecoration: "none",
                    }}
                  >
                    <MessageCircle style={{ width: "15px", height: "15px" }} />
                    Chat support on WhatsApp
                  </a>
                </div>
              ) : (
                /* IN-PROGRESS — shimmer bar */
                <div
                  className="rounded-3xl p-5"
                  style={{
                    background: "#ffffff",
                    border:     "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    style={{
                      height:       "3px",
                      borderRadius: "9999px",
                      overflow:     "hidden",
                      background:   "rgba(0,0,0,0.06)",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        height:         "100%",
                        width:          "40%",
                        borderRadius:   "9999px",
                        background:     "linear-gradient(90deg, #e65100, #f37d01, #e65100)",
                        backgroundSize: "200% 100%",
                        animation:      "gold-shimmer 1.4s linear infinite",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      fontFamily:   "var(--font-heading)",
                      fontWeight:   600,
                      fontSize:     "0.85rem",
                      color:        "#111",
                      marginBottom: "4px",
                    }}
                  >
                    Working on it
                    {elapsed > 0 && (
                      <span style={{ fontWeight: 400, color: "#aaa", marginLeft: "6px" }}>
                        {elapsed}s elapsed
                      </span>
                    )}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "0.75rem", color: "#888", lineHeight: 1.6 }}>
                    You can close this page — data arrives even if you leave. Most orders land in under 60 seconds.
                  </p>

                  {showSupportNudge && (
                    <div
                      className="mt-4 rounded-2xl p-4"
                      style={{
                        background: "rgba(245,158,11,0.06)",
                        border:     "1px solid rgba(245,158,11,0.25)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily:   "var(--font-heading)",
                          fontWeight:   600,
                          fontSize:     "0.78rem",
                          color:        "#b45309",
                          marginBottom: "4px",
                        }}
                      >
                        Still waiting?
                      </p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "0.72rem", color: "#555", lineHeight: 1.5, marginBottom: "12px" }}>
                        If you completed Paystack payment, wait another minute. If not, start a new order.
                      </p>
                      <a
                        href={`https://wa.me/233500843914?text=${encodeURIComponent(`Hi, order ${order.id.slice(0, 8)} still pending after 30s.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5"
                        style={{
                          background:     "#25D366",
                          color:          "#ffffff",
                          fontFamily:     "var(--font-heading)",
                          fontWeight:     700,
                          fontSize:       "0.75rem",
                          padding:        "7px 16px",
                          borderRadius:   "9999px",
                          textDecoration: "none",
                        }}
                      >
                        <MessageCircle style={{ width: "13px", height: "13px" }} />
                        Contact support
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="flex gap-2 mt-1">
                <Link
                  to="/"
                  className="btn-orange flex-1 inline-flex items-center justify-center gap-1.5"
                  style={{ padding: "12px 20px", fontSize: "0.82rem", textDecoration: "none" }}
                >
                  Buy another
                  <ChevronRight style={{ width: "14px", height: "14px" }} />
                </Link>
                <a
                  href={`https://wa.me/233500843914?text=${encodeURIComponent(`Hi, question about order ${order.id.slice(0, 8)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5"
                  style={{
                    padding:        "12px 16px",
                    borderRadius:   "9999px",
                    border:         "1.5px solid rgba(0,0,0,0.12)",
                    background:     "#ffffff",
                    fontFamily:     "var(--font-heading)",
                    fontWeight:     600,
                    fontSize:       "0.82rem",
                    color:          "#111",
                    textDecoration: "none",
                    whiteSpace:     "nowrap",
                  }}
                >
                  <MessageCircle style={{ width: "15px", height: "15px", color: "#25D366" }} />
                  Help
                </a>
              </div>

            </div>
          )}
        </div>
      </main>
    </>
  );
}
