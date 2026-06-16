// Auto-retry hook for failed Mobigh deliveries.
// Called by a Cloudflare Cron Trigger every 5 minutes (configure in wrangler.jsonc).
// Logic:
//   • Picks up orders with status "failed" and retry_count < 3
//   • Attempts Mobigh fulfillment again
//   • On success → marks "delivered", sends SMS + Telegram notification
//   • On failure → increments retry_count; if retry_count reaches 3 → marks
//     "failed" permanently and sends a Telegram alert for manual intervention
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
        // Set CRON_SECRET in your .env / Cloudflare secrets.
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

        // Find all failed orders that haven't exhausted their retry budget.
        // retry_count is stored in the notes field as "[retries:N]" until a
        // dedicated column is added via migration (see Note below).
        const { data: failed, error } = await supabaseAdmin
          .from("orders")
          .select("id, network, data_mb, recipient_phone, notes, amount_ghs")
          .eq("status", "failed")
          .order("created_at", { ascending: true })
          .limit(20); // process max 20 per run to stay within Cloudflare CPU limits

        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }

        const results: { id: string; outcome: string }[] = [];

        for (const order of failed ?? []) {
          // Parse retry count embedded in notes
          const retryMatch = (order.notes ?? "").match(/\[retries:(\d+)\]/);
          const retryCount = retryMatch ? parseInt(retryMatch[1], 10) : 0;

          if (retryCount >= MAX_RETRIES) {
            // Already exhausted — skip, leave for manual admin action
            results.push({ id: order.id, outcome: "skipped:max_retries" });
            continue;
          }

          const newRetryCount = retryCount + 1;
          const notesWithoutTag = (order.notes ?? "").replace(/\[retries:\d+\]/, "").trim();
          const updatedNotes = `${notesWithoutTag} [retries:${newRetryCount}]`.trim();

          // Mark as processing before attempting
          await supabaseAdmin
            .from("orders")
            .update({ status: "processing", notes: updatedNotes })
            .eq("id", order.id);

          const result = await fulfill({
            network: order.network as any,
            dataMb: order.data_mb,
            recipientPhone: order.recipient_phone,
            orderId: order.id,
          });

          if (result.ok) {
            await supabaseAdmin
              .from("orders")
              .update({ status: "delivered", reseller_reference: result.reference })
              .eq("id", order.id);

            await notifyAdmin(
              `🔁✅ <b>Auto-retry delivered</b> (attempt ${newRetryCount}/${MAX_RETRIES})\n${order.network} ${(order.data_mb / 1024).toFixed(1)}GB → ${order.recipient_phone}\nRef: ${result.reference}`,
            );
            await deliveredSms({
              phone: order.recipient_phone,
              network: order.network,
              dataMb: order.data_mb,
              orderId: order.id,
            });
            results.push({ id: order.id, outcome: "delivered" });
          } else {
            // Re-mark as failed with updated retry count
            await supabaseAdmin
              .from("orders")
              .update({ status: "failed", notes: `${updatedNotes} — ${result.error}`.trim() })
              .eq("id", order.id);

            if (newRetryCount >= MAX_RETRIES) {
              // Final failure — alert admin for manual intervention
              await notifyAdmin(
                `🔁❌ <b>Auto-retry exhausted</b> (${MAX_RETRIES}/${MAX_RETRIES} attempts)\n${order.network} ${(order.data_mb / 1024).toFixed(1)}GB → ${order.recipient_phone}\nLast error: ${result.error}\nOrder: <code>${order.id.slice(0, 8)}</code> — manual action required.`,
              );
              results.push({ id: order.id, outcome: "failed:exhausted" });
            } else {
              results.push({ id: order.id, outcome: `failed:retry_${newRetryCount}` });
            }
          }
        }

        return Response.json({
          ok: true,
          processed: results.length,
          results,
        });
      },

      GET: async () =>
        new Response("Auto-retry hook. POST only. Requires x-cron-secret header.", { status: 405 }),
    },
  },
});
