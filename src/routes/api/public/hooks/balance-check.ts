import { createFileRoute } from "@tanstack/react-router";

// Configurable warning threshold (GHS). Defaults to 50.
// NOTE: this now checks Hubnet's wallet, not Mobigh's — Hubnet is the
// provider that actually spends money delivering bundles. Mobigh's wallet
// (pricing-catalog sync only) no longer needs a low-balance alert.
const THRESHOLD_DEFAULT = 50;

export const Route = createFileRoute("/api/public/hooks/balance-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getHubnetBalance } = await import("@/lib/reseller-packages.server");
        const { notifyAdmin } = await import("@/lib/notify.server");

        let threshold = THRESHOLD_DEFAULT;
        try {
          const body = (await request.json()) as { threshold?: number };
          if (typeof body?.threshold === "number") threshold = body.threshold;
        } catch {}

        try {
          const balance = await getHubnetBalance();
          if (balance < threshold) {
            await notifyAdmin(
              `⚠️ <b>Low Hubnet wallet</b>\nBalance: <b>GHS ${balance.toFixed(2)}</b>\nThreshold: GHS ${threshold.toFixed(2)}\nTop up to avoid delivery failures.`,
            );
          }
          return Response.json({ ok: true, balance, threshold, alerted: balance < threshold });
        } catch (e: any) {
          await notifyAdmin(`❌ Hubnet balance check failed: ${e?.message ?? "unknown error"}`);
          return Response.json({ ok: false, error: e?.message ?? "failed" }, { status: 500 });
        }
      },
    },
  },
});
