import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery }      from "@tanstack/react-query";
import { useServerFn }   from "@tanstack/react-start";
import { listMyOrders }  from "@/lib/orders.functions";
import { Button }        from "@/components/ui/button";
import { StatusBadge, NetworkBadge } from "@/components/status-badge";
import { ShoppingBag, ArrowRight, Wifi } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const fn   = useServerFn(listMyOrders);
  const { data } = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });
  const orders = data?.orders ?? [];
  const recent = orders.slice(0, 5);

  return (
    <main
      className="min-h-screen pt-20 pb-24 lg:pb-10 px-4"
      style={{ background: "var(--color-background)" }}
    >
      <div className="container mx-auto max-w-3xl py-8">

        {/* Header */}
        <div
          className="flex items-center justify-between mb-8"
          style={{ animation: "slide-up 0.5s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <div>
            <h1
              className="text-2xl font-black"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
            >
              Dashboard
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Your recent activity</p>
          </div>
          <Button asChild
            className="btn-electric rounded-full px-5 py-2.5 text-sm font-bold border-0"
            style={{ background: "linear-gradient(135deg, #0066ff, #0044cc)" }}
          >
            <Link to="/" className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Buy bundle
            </Link>
          </Button>
        </div>

        {/* Orders card */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background:   "rgba(255,255,255,0.70)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border:       "1px solid rgba(0,102,255,0.10)",
            boxShadow:    "0 4px 32px rgba(0,102,255,0.06)",
            animation:    "scale-in 0.5s cubic-bezier(0.22,1,0.36,1) 0.08s both",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(0,102,255,0.08)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "rgba(0,102,255,0.08)" }}
              >
                <ShoppingBag className="h-4 w-4" style={{ color: "#0066ff" }} />
              </span>
              <h2 className="text-sm font-bold" style={{ color: "var(--color-foreground)" }}>Recent orders</h2>
            </div>
            <Link
              to="/orders"
              className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80"
              style={{ color: "#0066ff" }}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Orders list */}
          <div>
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(0,102,255,0.06)" }}
                >
                  <ShoppingBag className="h-6 w-6" style={{ color: "#0066ff", opacity: 0.5 }} />
                </span>
                <p className="text-sm text-muted-foreground">No orders yet.</p>
                <Link to="/" className="text-sm font-semibold" style={{ color: "#0066ff" }}>Browse bundles →</Link>
              </div>
            ) : (
              <ul>
                {recent.map((o: any, i: number) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-blue-50/50"
                    style={{
                      borderBottom: i < recent.length - 1 ? "1px solid rgba(0,102,255,0.06)" : "none",
                      animation: `slide-in-right 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.05}s both`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <NetworkBadge network={o.network} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                          {(o.data_mb / 1024).toFixed(1)} GB → {o.recipient_phone}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                        GHS {Number(o.amount_ghs).toFixed(2)}
                      </span>
                      <StatusBadge status={o.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
