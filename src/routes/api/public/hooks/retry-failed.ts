// Auto-retry hook for failed Hubnet deliveries.
// Called by a Cloudflare Cron Trigger every 5 minutes (see wrangler.jsonc /
// src/server.ts `scheduled` handler).
//
// Two queues, both funnelled through the same per-order handling logic:
//
//   1. status = "failed" AND retry_count < MAX_RETRIES        (original behaviour)
//   2. status = "processing" AND stuck for > STUCK_PROCESSING_MINUTES   (patch 4 bug fix)
//
// Queue 2 exists because this hook previously only ever queried
// status="failed". If a request crashed or timed out after the order was
// marked "processing" but before fulfill() returned, it became invisible
// to this hook forever — stuck in "processing" with nobody ever retrying
// or alerting on it. Queue 2 sweeps those up.
//
// Both queues route through fulfill()'s own idempotency safeguard (see
// reseller.server.ts): a "pending" result means Hubnet hasn't resolved the
// transaction yet, so we deliberately do NOT touch status or retry_count —
// leaving the order to be picked up again on a later pass.
//
// HARD-TIMEOUT ESCALATION (patch 5): if an order stays "pending" past
// HARD_TIMEOUT_MINUTES, we send ONE admin alert (tracked via
// stuck_alert_sent_at), then only re-alert every ESCALATION_REPEAT_MINUTES
// after that. Without this, an order Hubnet never resolves would get
// silently re-checked every 5 minutes forever with zero visibility.
//
// The endpoint is also callable manually (admin convenience) with:
//   POST /api/public/hooks/retry-failed
//   Header: x-cron-secret: <CRON_SECRET env var>

import { createFileRoute } from "@tanstack/react-router";

const MAX_RETRIES = 3;
const STUCK_PROCESSING_MINUTES = 10;
const HARD_TIMEOUT_MINUTES = 60;
const ESCALATION_REPEAT_MINUTES = 360; // 6 hours

type OrderRow = {
  id: string;
  network: "MTN" | "Telecel" | "AT";
  data_mb: number;
  recipient_phone: string;
  notes: string | null;
  amount_ghs: number;
  retry_count: number;
  updated_at: string;
  reseller_reference: string | null;
  stuck_alert_sent_at: string | null;
};

const ORDER_SELECT =
  "id, network, data_mb, recipient_phone, notes, amount_ghs, retry_count, updated_at, reseller_reference, stuck_alert_sent_at";

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

        async function maybeEscalate(order: OrderRow): Promise<boolean> {
          const stuckSinceMs = Date.now() - new Date(order.updated_at).getTime();
          if (stuckSinceMs < HARD_TIMEOUT_MINUTES * 60_000) return false;

          const lastAlertMs = order.stuck_alert_sent_at
            ? Date.now() - new Date(order.stuck_alert_sent_at).getTime()
            : Infinity;
          if (lastAlertMs < ESCALATION_REPEAT_MINUTES * 60_000) return false; // alerted recently, stay quiet

          const hours = (stuckSinceMs / 3_600_000).toFixed(1);
          await notifyAdmin(
            `🕐 <b>Order stuck unresolved for ${hours}h</b>\n${order.network} ${(order.data_mb / 1024).toFixed(1)}GB to ${order.recipient_phone}\nHubnet reference: ${order.reseller_reference ?? "none"}\nHubnet has not confirmed delivery or failure — check the transaction manually via Hubnet's console/status endpoint. Order: ${order.id.slice(0, 8)}`,
          );
          await supabaseAdmin
            .from("orders")
            .update({ stuck_alert_sent_at: new Date().toISOString() })
            .eq("id", order.id);
          return true;
        }

        async function processOrder(
          order: OrderRow,
          source: "failed-queue" | "stuck-processing",
        ): Promise<{ id: string; outcome: string }> {
          const newRetryCount = (order.retry_count ?? 0) + 1;

          const result = await fulfill({
            network: order.network,
            dataMb: order.data_mb,
            recipientPhone: order.recipient_phone,
            orderId: order.id,
          });

          if (result.ok) {
            await supabaseAdmin
              .from("orders")
              .update({
                status:              "delivered",
                reseller_reference:  result.reference,
                retry_count:         0,
              })
              .eq("id", order.id);

            await notifyAdmin(
              `Retry delivered (${source}, attempt ${newRetryCount}/${MAX_RETRIES})\n${order.network} ${(order.data_mb / 1024).toFixed(1)}GB to ${order.recipient_phone}\nRef: ${result.reference}`,
            );
            await deliveredSms({
              phone:   order.recipient_phone,
              network: order.network,
              dataMb:  order.data_mb,
              orderId: order.id,
            });
            return { id: order.id, outcome: "delivered" };
          }

          if (result.pending) {
            // Genuinely unresolved — do NOT mark failed, do NOT burn a
            // retry attempt. Leave status/retry_count untouched; a later
            // pass (queue 2, once it goes stale again) will re-check.
            const escalated = await maybeEscalate(order);
            return { id: order.id, outcome: escalated ? "still-pending:escalated" : "still-pending" };
          }

          // Definitive failure.
          const isFinal = newRetryCount >= MAX_RETRIES;
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
              `Auto-retry exhausted (${source}, ${MAX_RETRIES}/${MAX_RETRIES} attempts)\n${order.network} ${(order.data_mb / 1024).toFixed(1)}GB to ${order.recipient_phone}\nLast error: ${result.error}\nOrder: ${order.id.slice(0, 8)} — manual action required.`,
            );
            return { id: order.id, outcome: "failed:exhausted" };
          }
          return { id: order.id, outcome: `failed:retry_${newRetryCount}` };
        }

        const results: { id: string; outcome: string }[] = [];

        // ---- Queue 1: explicitly failed orders (original behaviour) -------
        const { data: failed, error: failedErr } = await supabaseAdmin
          .from("orders")
          .select(ORDER_SELECT)
          .eq("status", "failed")
          .lt("retry_count", MAX_RETRIES)
          .order("created_at", { ascending: true })
          .limit(20);

        if (failedErr) {
          return Response.json({ ok: false, error: failedErr.message }, { status: 500 });
        }

        for (const order of (failed ?? []) as OrderRow[]) {
          await supabaseAdmin
            .from("orders")
            .update({ status: "processing" })
            .eq("id", order.id);
          results.push(await processOrder(order, "failed-queue"));
        }

        // ---- Queue 2: orders stuck in "processing" (patch 4 bug fix) -------
        const staleCutoff = new Date(Date.now() - STUCK_PROCESSING_MINUTES * 60 * 1000).toISOString();
        const { data: stuck, error: stuckErr } = await supabaseAdmin
          .from("orders")
          .select(ORDER_SELECT)
          .eq("status", "processing")
          .lt("updated_at", staleCutoff)
          .order("created_at", { ascending: true })
          .limit(20);

        if (stuckErr) {
          return Response.json(
            { ok: false, error: stuckErr.message, partial: results },
            { status: 500 },
          );
        }

        for (const order of (stuck ?? []) as OrderRow[]) {
          results.push(await processOrder(order, "stuck-processing"));
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
