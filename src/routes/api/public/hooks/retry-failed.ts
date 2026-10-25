// Auto-retry hook for failed Mobigh deliveries.
// Called by a Cloudflare Cron Trigger every 5 minutes (configure in wrangler.jsonc).
// Logic:
//   • Picks up orders with status "failed" and retry_count < MAX_RETRIES
//   • Attempts Mobigh fulfillment again
//   • On success → marks "delivered", sends SMS + Telegram notification
//   • On failure → increments retry_count via DB column (patch-3);
//     if retry_count reaches MAX_RETRIES → marks "failed" permanently
//     and sends a Telegram alert for manual intervention
//
// PATCH 3: retry_count is now a proper integer column on orders (no more
// "[retries:N]" string parsing in notes). The migration backfills existing rows.
//
// To wire up the cron, add to wrangler.jsonc:
//   "triggers": { "crons": ["*/5 * * * *"] }
// And in src/server.ts export a `scheduled` handler that POSTs to this route.
//
// The endpoint is also callable manually (admin convenience) with:
//   POST /api/public/hooks/retry-failed
//   Header: x-cron-secret: <CRON_SECRET env var>

import { createFileRoute } from "@tanstack/react-router";

const MAX_RETRIES = 3;

export const Route = createFileRoute("/api/public/hooks/retry-failed")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Shared secret guard — prevents public abuse of this endpoint.
        const secret = process.env.CRON_SECRET;
        if (secret) {
          const provided = request.headers.get("x-cron-secret");
          if (provided !== secret) {
            return new Response("Unauthorized", { status: 401 });
          }
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { fulfill }       = await import("@/lib/reseller.server");
        const { notifyAdmin }   = await import("@/lib/notify.server");
        const { deliveredSms }  = await import("@/lib/sms.server");

        // Query uses the real retry_count column — no string parsing.
        const { data: failed, error } = await supabaseAdmin
          .from("orders")
          .select("id, network, data_mb, recipient_phone, notes, amount_ghs, retry_count")
          .eq("status", "failed")
          .lt("retry_count", MAX_RETRIES)   // DB-level filter replaces client-side skip
          .order("created_at", { ascending: true })
          .limit(20);

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const results: { id: string; outcome: string }[] = [];

        for (const order of failed ?? []) {
          const newRetryCount = (order.retry_count ?? 0) + 1;

          // Mark as processing before attempting — reset retry_count increment
          // happens on failure path only; success path clears it implicitly.
          await supabaseAdmin
            .from("orders")
            .update({ status: "processing" })
            .eq("id", order.id);

          const result = await fulfill({
            network: order.network as any,
            dataMb: order.data_mb,
            recipientPhone: order.recipient_phone,
            orderId: order.id,
          });

          if (result.ok) {
            // Success — clear retry_count back to 0 and mark delivered
            await supabaseAdmin
              .from("orders")
              .update({
                status:              "delivered",
                reseller_reference:  result.reference,
                retry_count:         0,
              })
              .eq("id", order.id);

            await notifyAdmin(
              `Retry delivered (attempt ${newRetryCount}/${MAX_RETRIES})\n${order.network} ${(order.data_mb / 1024).toFixed(1)}GB to ${order.recipient_phone}\nRef: ${result.reference}`,
            );
            await deliveredSms({
              phone:   order.recipient_phone,
              network: order.network,
              dataMb:  order.data_mb,
              orderId: order.id,
            });
            results.push({ id: order.id, outcome: "delivered" });
          } else {
            // Failure — write retry_count to the real column
            const isFinal = newRetryCount >= MAX_RETRIES;

            // Strip old ip tag from notes so we don't keep leaking it into
            // the failure reason; keep any human-readable error text.
            const cleanNotes = (order.notes ?? "")
              .replace(/\[ip:[^\]]+\]/g, "")
              .trim();
            const failureNote = `${cleanNotes} — ${result.error}`.replace(/^—\s*/, "").trim();

            await supabaseAdmin
              .from("orders")
              .update({
                status:      "failed",
                retry_count: newRetryCount,
                notes:       failureNote || null,
              })
              .eq("id", order.id);

            if (isFinal) {
              await notifyAdmin(
                `Auto-retry exhausted (${MAX_RETRIES}/${MAX_RETRIES} attempts)\n${order.network} ${(order.data_mb / 1024).toFixed(1)}GB to ${order.recipient_phone}\nLast error: ${result.error}\nOrder: ${order.id.slice(0, 8)} — manual action required.`,
              );
              results.push({ id: order.id, outcome: "failed:exhausted" });
            } else {
              results.push({ id: order.id, outcome: `failed:retry_${newRetryCount}` });
            }
          }
        }

        return Response.json({
          ok:        true,
          processed: results.length,
          results,
        });
      },

      GET: async () =>
        new Response("Auto-retry hook. POST only. Requires x-cron-secret header.", { status: 405 }),
    },
  },
});
