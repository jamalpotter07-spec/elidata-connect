// /track — Public order search page.
// Lets any customer find their order by:
//   • Phone number  → shows last 10 orders for that number
//   • Order ID      → navigates directly to /track/$orderId
// This page was missing entirely; all nav links to "/track" 404'd.

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { searchOrdersByPhone } from "@/lib/orders.functions";
import { NavBar } from "@/components/nav-bar";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import {
  Search,
  Phone,
  Hash,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  PackageSearch,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/track")({
  component: TrackSearchPage,
  head: () => ({
    meta: [
      { title: "Track Your Order — Eli Data Resales" },
      {
        name: "description",
        content:
          "Track your data bundle order by phone number or order ID. Check delivery status in real time.",
      },
    ],
  }),
});

// ── Status chip colours ──────────────────────────────────────────────────────
function statusMeta(status: string) {
  switch (status) {
    case "delivered":
      return { label: "Delivered", color: "#16a34a", bg: "rgba(34,197,94,0.10)", Icon: CheckCircle2 };
    case "failed":
      return { label: "Failed", color: "#dc2626", bg: "rgba(239,68,68,0.10)", Icon: XCircle };
    case "processing":
      return { label: "Processing", color: "#d97706", bg: "rgba(245,158,11,0.10)", Icon: Loader2 };
    case "paid":
      return { label: "Paid", color: "#0284c7", bg: "rgba(14,165,233,0.10)", Icon: ArrowRight };
    default:
      return { label: "Pending", color: "#6b7280", bg: "rgba(107,114,128,0.10)", Icon: Clock };
  }
}

// ── Network pill ─────────────────────────────────────────────────────────────
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
        fontSize:      "0.62rem",
        letterSpacing: "0.06em",
        padding:       "2px 10px",
        borderRadius:  "9999px",
        display:       "inline-flex",
        alignItems:    "center",
        whiteSpace:    "nowrap",
      }}
    >
      {network === "AT" ? "Airtel-Tigo" : network}
    </span>
  );
}

// ── Detected mode (phone vs order-id) ────────────────────────────────────────
function detectMode(val: string): "phone" | "orderId" | "unknown" {
  if (/^0\d{9}$/.test(val.trim())) return "phone";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()))
    return "orderId";
  // also accept the 8-char prefix format customers see in UI
  if (/^[0-9a-f]{8}$/i.test(val.trim())) return "unknown";
  return "unknown";
}

// ── Main component ────────────────────────────────────────────────────────────
function TrackSearchPage() {
  const navigate  = useNavigate();
  const inputRef  = useRef<HTMLInputElement>(null);
  const [query,   setQuery]   = useState("");
  const [error,   setError]   = useState<string | null>(null);

  const searchFn = useServerFn(searchOrdersByPhone);

  // useMutation so we can track isPending / data cleanly
  const { mutate: doSearch, isPending, data: results, reset } = useMutation({
    mutationFn: (phone: string) => searchFn({ data: { phone } }),
    onError: (e: any) => setError(e?.message ?? "Search failed — please try again."),
  });

  const mode = detectMode(query);

  const handleSubmit = () => {
    setError(null);
    reset();

    const trimmed = query.trim();
    if (!trimmed) {
      setError("Enter your phone number or order ID.");
      inputRef.current?.focus();
      return;
    }

    if (mode === "orderId") {
      // Full UUID — navigate straight to the live tracking page
      navigate({ to: "/track/$orderId", params: { orderId: trimmed } });
      return;
    }

    if (mode === "phone") {
      doSearch(trimmed);
      return;
    }

    // Unknown format
    setError("Enter a valid 10-digit Ghana phone number (e.g. 0241234567) or your full order ID.");
    inputRef.current?.focus();
  };

  const orders = results?.orders ?? [];

  return (
    <>
      <NavBar />
      <WhatsAppFloat />

      <main
        style={{
          minHeight:     "100svh",
          background:    "var(--background)",
          paddingTop:    "96px",
          paddingBottom: "100px",
        }}
      >
        <div className="mx-auto px-4" style={{ maxWidth: "520px" }}>

          {/* ── Header ── */}
          <div
            style={{ marginBottom: "32px", animation: "slide-up 0.55s cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <p className="eyebrow mb-1">Live tracking</p>
            <h1
              style={{
                fontFamily:    "var(--font-hero)",
                fontWeight:    800,
                fontSize:      "clamp(1.8rem, 6vw, 2.4rem)",
                letterSpacing: "-0.025em",
                color:         "var(--foreground)",
                lineHeight:    1.1,
                marginBottom:  "10px",
              }}
            >
              Track your order
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize:   "0.85rem",
                color:      "var(--muted-foreground)",
                lineHeight: 1.6,
              }}
            >
              Enter the phone number you used, or paste your full order ID.
            </p>
          </div>

          {/* ── Search card ── */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background:   "var(--card)",
              border:       "1px solid var(--border)",
              boxShadow:    "0 4px 24px rgba(0,0,0,0.06)",
              backdropFilter:       "blur(12px) saturate(1.4)",
              WebkitBackdropFilter: "blur(12px) saturate(1.4)",
              animation:    "scale-in 0.45s cubic-bezier(0.22,1,0.36,1) 0.08s both",
            }}
          >
            {/* Accent top bar */}
            <div style={{ height: "3px", background: "linear-gradient(90deg,#e65100,#f37d01)" }} />

            <div className="p-6 flex flex-col gap-4">

              {/* Mode hint pill */}
              {query.length > 0 && (
                <div
                  className="inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1"
                  style={{
                    background:    mode === "phone"
                      ? "rgba(34,197,94,0.08)"
                      : mode === "orderId"
                        ? "rgba(14,165,233,0.08)"
                        : "rgba(0,0,0,0.04)",
                    border:        mode === "phone"
                      ? "1px solid rgba(34,197,94,0.20)"
                      : mode === "orderId"
                        ? "1px solid rgba(14,165,233,0.20)"
                        : "1px solid rgba(0,0,0,0.06)",
                    animation:     "fade-in 0.2s ease both",
                  }}
                >
                  {mode === "phone"
                    ? <Phone style={{ width: "11px", height: "11px", color: "#16a34a" }} />
                    : mode === "orderId"
                      ? <Hash  style={{ width: "11px", height: "11px", color: "#0284c7" }} />
                      : <Search style={{ width: "11px", height: "11px", color: "#9ca3af" }} />}
                  <span
                    style={{
                      fontFamily:    "var(--font-body)",
                      fontSize:      "0.68rem",
                      fontWeight:    600,
                      color:         mode === "phone"
                        ? "#16a34a"
                        : mode === "orderId"
                          ? "#0284c7"
                          : "#9ca3af",
                    }}
                  >
                    {mode === "phone"
                      ? "Phone number detected — will search all your orders"
                      : mode === "orderId"
                        ? "Order ID detected — will go to tracking page"
                        : "Keep typing…"}
                  </span>
                </div>
              )}

              {/* Input row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    style={{
                      position:  "absolute",
                      left:      "14px",
                      top:       "50%",
                      transform: "translateY(-50%)",
                      width:     "16px",
                      height:    "16px",
                      color:     "var(--muted-foreground)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    autoComplete="tel"
                    placeholder="0241234567 or order ID"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setError(null); reset(); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    style={{
                      width:          "100%",
                      paddingLeft:    "40px",
                      paddingRight:   "14px",
                      paddingTop:     "12px",
                      paddingBottom:  "12px",
                      borderRadius:   "14px",
                      border:         error
                        ? "1.5px solid rgba(239,68,68,0.50)"
                        : "1.5px solid var(--border)",
                      background:     "var(--input)",
                      fontFamily:     "var(--font-body)",
                      fontSize:       "0.92rem",
                      color:          "var(--foreground)",
                      outline:        "none",
                      transition:     "border-color 0.2s",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.60)" : "#e65100")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = error
                        ? "rgba(239,68,68,0.50)"
                        : "var(--border)")
                    }
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="btn-orange flex items-center justify-center gap-1.5 shrink-0"
                  style={{
                    padding:         "12px 20px",
                    fontSize:        "0.88rem",
                    fontWeight:      700,
                    borderRadius:    "14px",
                    minWidth:        "88px",
                    opacity:         isPending ? 0.7 : 1,
                    transition:      "opacity 0.2s, transform 0.2s",
                  }}
                  aria-label="Search order"
                >
                  {isPending ? (
                    <Loader2
                      style={{ width: "16px", height: "16px" }}
                      className="animate-spin"
                    />
                  ) : (
                    <>
                      <Search style={{ width: "15px", height: "15px" }} />
                      <span>Find</span>
                    </>
                  )}
                </button>
              </div>

              {/* Inline error */}
              {error && (
                <p
                  style={{
                    fontFamily:  "var(--font-body)",
                    fontSize:    "0.78rem",
                    color:       "#dc2626",
                    marginTop:   "-8px",
                    lineHeight:  1.5,
                    animation:   "fade-in 0.18s ease both",
                  }}
                >
                  {error}
                </p>
              )}

              {/* Helper tips */}
              <div
                className="flex flex-col gap-1.5 pt-1"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <p
                  style={{
                    fontFamily:    "var(--font-body)",
                    fontSize:      "0.7rem",
                    color:         "var(--muted-foreground)",
                    paddingTop:    "12px",
                    lineHeight:    1.55,
                  }}
                >
                  Use the phone number you entered at checkout. Check balance after delivery:{" "}
                  <code style={{ fontWeight: 700, color: "var(--foreground)" }}>*124#</code> (MTN)
                  {" · "}
                  <code style={{ fontWeight: 700, color: "var(--foreground)" }}>*110#</code> (Telecel)
                  {" · "}
                  <code style={{ fontWeight: 700, color: "var(--foreground)" }}>*100#</code> (AT)
                </p>
              </div>
            </div>
          </div>

          {/* ── Results ── */}
          {results !== undefined && (
            <div
              className="mt-4 flex flex-col gap-3"
              style={{ animation: "slide-up 0.40s cubic-bezier(0.22,1,0.36,1) both" }}
            >
              {orders.length === 0 ? (
                /* Empty state */
                <div
                  className="rounded-3xl flex flex-col items-center justify-center gap-3 py-12 px-6 text-center"
                  style={{
                    background: "var(--card)",
                    border:     "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      display:         "flex",
                      alignItems:      "center",
                      justifyContent:  "center",
                      width:           "52px",
                      height:          "52px",
                      borderRadius:    "50%",
                      background:      "rgba(0,0,0,0.04)",
                    }}
                  >
                    <PackageSearch
                      style={{ width: "24px", height: "24px", color: "#9ca3af" }}
                    />
                  </span>
                  <p
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize:   "0.95rem",
                      color:      "var(--foreground)",
                    }}
                  >
                    No orders found
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize:   "0.78rem",
                      color:      "var(--muted-foreground)",
                      lineHeight: 1.6,
                      maxWidth:   "28ch",
                    }}
                  >
                    No orders for this number. Make sure you enter the exact phone number used at checkout.
                  </p>
                  <a
                    href="https://wa.me/233500843914"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5"
                    style={{
                      background:     "#25D366",
                      color:          "#ffffff",
                      fontFamily:     "var(--font-heading)",
                      fontWeight:     700,
                      fontSize:       "0.78rem",
                      padding:        "8px 18px",
                      borderRadius:   "9999px",
                      textDecoration: "none",
                      marginTop:      "4px",
                    }}
                  >
                    <MessageCircle style={{ width: "14px", height: "14px" }} />
                    Chat support
                  </a>
                </div>
              ) : (
                <>
                  <p
                    style={{
                      fontFamily:    "var(--font-eyebrow)",
                      fontSize:      "0.65rem",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color:         "var(--muted-foreground)",
                      paddingLeft:   "4px",
                    }}
                  >
                    {orders.length} order{orders.length !== 1 ? "s" : ""} found
                  </p>

                  {orders.map((order: any, i: number) => {
                    const sm   = statusMeta(order.status);
                    const gbLabel =
                      (order.data_mb / 1024) % 1 === 0
                        ? `${order.data_mb / 1024}`
                        : (order.data_mb / 1024).toFixed(1);
                    const dateStr = new Date(order.created_at).toLocaleDateString("en-GH", {
                      day:   "2-digit",
                      month: "short",
                      year:  "numeric",
                      hour:  "2-digit",
                      minute:"2-digit",
                    });

                    return (
                      <Link
                        key={order.id}
                        to="/track/$orderId"
                        params={{ orderId: order.id }}
                        style={{
                          display:    "block",
                          textDecoration: "none",
                          animation:  `scale-in 0.35s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s both`,
                        }}
                      >
                        <div
                          className="rounded-3xl overflow-hidden transition-all"
                          style={{
                            background:  "var(--card)",
                            border:      "1px solid var(--border)",
                            boxShadow:   "0 2px 12px rgba(0,0,0,0.04)",
                            cursor:      "pointer",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.10)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)")
                          }
                        >
                          {/* Status colour bar */}
                          <div
                            style={{
                              height:     "3px",
                              background: order.status === "delivered"
                                ? "linear-gradient(90deg,#22c55e,#16a34a)"
                                : order.status === "failed"
                                  ? "linear-gradient(90deg,#ef4444,#dc2626)"
                                  : "linear-gradient(90deg,#e65100,#f37d01)",
                            }}
                          />

                          <div className="flex items-center justify-between px-5 py-4 gap-3">
                            {/* Left — network + size */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex flex-col gap-1.5">
                                <NetworkPill network={order.network} />
                                <span
                                  style={{
                                    fontFamily:    "var(--font-hero)",
                                    fontWeight:    800,
                                    fontSize:      "1.5rem",
                                    color:         "var(--foreground)",
                                    letterSpacing: "-0.03em",
                                    lineHeight:    1,
                                  }}
                                >
                                  {gbLabel}
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      fontSize:   "0.85rem",
                                      color:      "var(--muted-foreground)",
                                      marginLeft: "2px",
                                    }}
                                  >
                                    GB
                                  </span>
                                </span>
                              </div>

                              <div className="flex flex-col gap-0.5 min-w-0">
                                {/* Status chip */}
                                <span
                                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 self-start"
                                  style={{ background: sm.bg }}
                                >
                                  <sm.Icon
                                    style={{ width: "10px", height: "10px", color: sm.color }}
                                    className={order.status === "processing" ? "animate-spin" : ""}
                                  />
                                  <span
                                    style={{
                                      fontFamily: "var(--font-heading)",
                                      fontWeight: 700,
                                      fontSize:   "0.65rem",
                                      color:      sm.color,
                                    }}
                                  >
                                    {sm.label}
                                  </span>
                                </span>

                                <span
                                  style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize:   "0.70rem",
                                    color:      "var(--muted-foreground)",
                                    marginTop:  "2px",
                                  }}
                                >
                                  {dateStr}
                                </span>
                              </div>
                            </div>

                            {/* Right — price + arrow */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex flex-col items-end gap-0.5">
                                <span
                                  style={{
                                    fontFamily: "var(--font-heading)",
                                    fontWeight: 700,
                                    fontSize:   "0.88rem",
                                    color:      "var(--foreground)",
                                  }}
                                >
                                  GHS {Number(order.amount_ghs).toFixed(2)}
                                </span>
                                <span
                                  style={{
                                    fontFamily:    "var(--font-body)",
                                    fontSize:      "0.60rem",
                                    color:         "var(--muted-foreground)",
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                              <span
                                style={{
                                  display:         "flex",
                                  alignItems:      "center",
                                  justifyContent:  "center",
                                  width:           "28px",
                                  height:          "28px",
                                  borderRadius:    "50%",
                                  background:      "rgba(230,81,0,0.08)",
                                  flexShrink:      0,
                                }}
                              >
                                <ChevronRight
                                  style={{ width: "14px", height: "14px", color: "#e65100" }}
                                />
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ── Help footer ── */}
          <div
            className="mt-8 flex flex-col items-center gap-3"
            style={{ animation: "fade-in 0.5s ease 0.3s both" }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize:   "0.75rem",
                color:      "var(--muted-foreground)",
                textAlign:  "center",
              }}
            >
              Can&apos;t find your order? Contact support and quote your phone number and payment amount.
            </p>
            <a
              href="https://wa.me/233500843914"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              style={{
                background:     "#25D366",
                color:          "#ffffff",
                fontFamily:     "var(--font-heading)",
                fontWeight:     700,
                fontSize:       "0.80rem",
                padding:        "10px 22px",
                borderRadius:   "9999px",
                textDecoration: "none",
                boxShadow:      "0 4px 16px rgba(37,211,102,0.28)",
              }}
            >
              <MessageCircle style={{ width: "15px", height: "15px" }} />
              WhatsApp Support
            </a>
          </div>

        </div>
      </main>
    </>
  );
}
