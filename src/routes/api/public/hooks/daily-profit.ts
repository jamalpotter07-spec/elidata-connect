import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/daily-profit")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { notifyAdmin } = await import("@/lib/notify.server");

        // 24h window in Africa/Accra (UTC+0)
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: orders, error } = await supabaseAdmin
          .from("orders")
          .select("id, network, data_mb, amount_ghs, status, bundle_id, created_at")
          .gte("created_at", since)
          .eq("status", "delivered");
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        const bundleIds = Array.from(new Set((orders ?? []).map((o) => o.bundle_id).filter(Boolean)));
        const costMap = new Map<string, number>();
        if (bundleIds.length) {
          const { data: bundles } = await supabaseAdmin
            .from("bundles").select("id, cost_price_ghs").in("id", bundleIds);
          for (const b of bundles ?? []) costMap.set(b.id as string, Number(b.cost_price_ghs ?? 0));
        }

        let revenue = 0;
        let cost = 0;
        const byNet: Record<string, { count: number; revenue: number; profit: number }> = {};
        for (const o of orders ?? []) {
          const rev = Number(o.amount_ghs);
          const c = costMap.get(o.bundle_id as string) ?? 0;
          revenue += rev;
          cost += c;
          const k = o.network as string;
          byNet[k] = byNet[k] ?? { count: 0, revenue: 0, profit: 0 };
          byNet[k].count++;
          byNet[k].revenue += rev;
          byNet[k].profit += rev - c;
        }
        const profit = revenue - cost;
        const lines = Object.entries(byNet)
          .map(([n, v]) => `• ${n}: ${v.count} orders · GHS ${v.revenue.toFixed(2)} rev · GHS ${v.profit.toFixed(2)} profit`)
          .join("\n");

        const msg =
          `📊 <b>Daily report</b> (last 24h)\n` +
          `Orders delivered: <b>${orders?.length ?? 0}</b>\n` +
          `Revenue: <b>GHS ${revenue.toFixed(2)}</b>\n` +
          `Cost: GHS ${cost.toFixed(2)}\n` +
          `<b>Profit: GHS ${profit.toFixed(2)}</b>` +
          (lines ? `\n\n${lines}` : "");
        await notifyAdmin(msg);

        return Response.json({ ok: true, orders: orders?.length ?? 0, revenue, profit });
      },
    },
  },
});
