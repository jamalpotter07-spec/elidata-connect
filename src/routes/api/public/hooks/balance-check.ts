import { createFileRoute } from "@tanstack/react-router";

// Configurable warning threshold (GHS). Defaults to 50.
const THRESHOLD_DEFAULT = 50;

export const Route = createFileRoute("/api/public/hooks/balance-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getMobighBalance } = await import("@/lib/reseller-packages.server");
        const { notifyAdmin } = await import("@/lib/notify.server");

        let threshold = THRESHOLD_DEFAULT;
        try {
          const body = (await request.json()) as { threshold?: number };
          if (typeof body?.threshold === "number") threshold = body.threshold;
        } catch {}

        try {
          const balance = await getMobighBalance();
          if (balance < threshold) {
            await notifyAdmin(
              `⚠️ <b>Low Mobigh wallet</b>\nBalance: <b>GHS ${balance.toFixed(2)}</b>\nThreshold: GHS ${threshold.toFixed(2)}\nTop up to avoid delivery failures.`,
            );
          }
          return Response.json({ ok: true, balance, threshold, alerted: balance < threshold });
        } catch (e: any) {
          await notifyAdmin(`❌ Balance check failed: ${e?.message ?? "unknown error"}`);
          return Response.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
        }
      },
    },
  },
});
