import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getGuestOrder } from "@/lib/orders.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/nav-bar";
import { NetworkBadge, StatusBadge } from "@/components/status-badge";
import { CheckCircle2, Clock, Loader2, MessageCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/track/$orderId")({
  component: TrackPage,
  head: () => ({ meta: [{ title: "Track your order — Eli Data Resales" }] }),
});

const STEPS = [
  { key: "pending", label: "Order received", desc: "Payment confirmed" },
  { key: "paid", label: "Sent to network", desc: "Forwarding to carrier" },
  { key: "processing", label: "Carrier processing", desc: "This can take 30s–3min" },
  { key: "delivered", label: "Delivered", desc: "Data is on your phone" },
] as const;

function stepIndex(status: string) {
  const idx = STEPS.findIndex((s) => s.key === status);
  if (status === "delivered") return 3;
  if (status === "processing") return 2;
  if (status === "paid") return 1;
  return idx >= 0 ? idx : 0;
}

function TrackPage() {
  const { orderId } = Route.useParams();
  const fn = useServerFn(getGuestOrder);
  const { data, isLoading } = useQuery({
    queryKey: ["track", orderId],
    queryFn: () => fn({ data: { orderId } }),
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.order?.status;
      return s === "delivered" || s === "failed" || s === "refunded" ? false : 2500;
    },
  });
  const order: any = data?.order;
  const status = order?.status ?? "pending";
  const active = stepIndex(status);
  const failed = status === "failed";

  // Elapsed timer for reassurance
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!order || ["delivered", "failed", "refunded"].includes(order.status)) return;
    const start = new Date(order.created_at).getTime();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [order]);

  // Show a support nudge if the order is still pending after 30 seconds.
  // Catches incomplete Paystack redirects or delayed webhooks so the customer
  // has a clear action path rather than a spinner with no feedback.
  const showSupportNudge = status === "pending" && elapsed >= 30;

  return (
    <>
      <NavBar />
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Live order tracking</span>
              {order && <StatusBadge status={order.status} />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading || !order ? (
              <div className="flex items-center gap-2 text-muted-foreground py-6">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your order…
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <NetworkBadge network={order.network} />
                    <span className="font-mono text-xs text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold">
                    {(order.data_mb / 1024).toFixed(order.data_mb % 1024 ? 1 : 0)} GB
                    <span className="ml-2 text-base font-medium text-muted-foreground">
                      → {order.recipient_phone}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    GHS {Number(order.amount_ghs).toFixed(2)}
                  </div>
                </div>

                {/* Progress timeline */}
                <ol className="relative space-y-5 pl-7">
                  <span className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                  {STEPS.map((step, i) => {
                    const done = i < active;
                    const current = i === active && !failed;
                    const isFail = failed && i === active;
                    return (
                      <li key={step.key} className="relative">
                        <span
                          className={`absolute -left-7 top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-background ${
                            isFail
                              ? "bg-destructive text-destructive-foreground"
                              : done
                                ? "bg-[hsl(var(--brand-orange))] text-white"
                                : current
                                  ? "bg-[hsl(var(--brand-navy))] text-white"
                                  : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isFail ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : done ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : current ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                        </span>
                        <div>
                          <div className={`font-medium ${current ? "text-foreground" : done ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </div>
                          <div className="text-xs text-muted-foreground">{step.desc}</div>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                {/* Reassurance panel */}
                {status === "delivered" ? (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                    <div className="font-semibold text-green-600 dark:text-green-400">
                      ✅ Delivered successfully
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Dial <span className="font-mono">*124#</span> (MTN), <span className="font-mono">*110#</span> (Telecel) or <span className="font-mono">*100#</span> (AT) to confirm your balance.
                    </p>
                  </div>
                ) : failed ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                    <div className="font-semibold text-destructive">Delivery hit a snag</div>
                    <p className="text-sm text-muted-foreground">
                      {order.notes || "The carrier rejected the request."} We've already been notified and will retry or refund within minutes.
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={`https://wa.me/233500843914?text=${encodeURIComponent(`Hi, my order ${order.id.slice(0, 8)} failed.`)}`}
                        target="_blank" rel="noreferrer"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" /> Chat support on WhatsApp
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--brand-orange))]" />
                      Working on it… {elapsed > 0 && <span className="text-muted-foreground font-normal">({elapsed}s elapsed)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      You can safely close this page — your data will arrive even if you leave.
                      Most orders land within 1 minute, but carriers occasionally take up to 5.
                      We'll keep retrying automatically.
                    </p>
                    {/* Indeterminate shimmer bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-1/3 animate-[shimmer_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-[hsl(var(--brand-navy))] via-[hsl(var(--brand-orange))] to-[hsl(var(--brand-navy))]" />
                    </div>
                    <style>{`@keyframes shimmer { 0% { transform: translateX(-100%);} 100% { transform: translateX(400%);} }`}</style>

                    {/* 30-second support nudge — shown when payment hasn't been confirmed yet.
                        Covers the case where the Paystack redirect never completed or the
                        webhook is delayed, so the customer has a clear action path. */}
                    {showSupportNudge && (
                      <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Still waiting? Your payment may not have been confirmed yet.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          If you completed payment on Paystack, please wait another minute — confirmations can be delayed.
                          If you did not complete payment, you can start a new order.
                        </p>
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                          <a
                            href={`https://wa.me/233500843914?text=${encodeURIComponent(`Hi, my order ${order.id.slice(0, 8)} is still pending after 30 seconds. Can you help?`)}`}
                            target="_blank" rel="noreferrer"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" /> Contact support
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to="/">Buy another bundle</Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <a
                      href={`https://wa.me/233500843914?text=${encodeURIComponent(`Hi, question about order ${order.id.slice(0, 8)}`)}`}
                      target="_blank" rel="noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" /> Need help?
                    </a>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
