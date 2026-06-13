import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function verifyPaystackSignature(
  secret: string,
  body: string,
  signature: string | null
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secret).update(body).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  return expectedBuf.length === actualBuf.length && timingSafeEqual(expectedBuf, actualBuf);
}

export const Route = createFileRoute("/api/public/hooks/paystack")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) {
          return Response.json(
            { ok: false, error: "PAYSTACK_SECRET_KEY not configured" },
            { status: 500 }
          );
        }

        const signature = request.headers.get("x-paystack-signature");
        const body = await request.text();

        if (!verifyPaystackSignature(secret, body, signature)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let event: any;
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("Bad Request", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (event.event === "charge.success") {
          const reference: string = event.data?.reference ?? "";
          if (!reference) return new Response("ok");

          // Find the order by Paystack reference
          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("paystack_reference", reference)
            .maybeSingle();

          if (!order) return new Response("ok");
          if (order.status !== "pending" && order.status !== "paid") return new Response("ok");

          // Upsert payment record
          await supabaseAdmin.from("payments").upsert(
            {
              order_id: order.id,
              reference,
              amount_ghs: event.data.amount / 100,
              status: "success",
              provider: "paystack",
              metadata: event.data,
            },
            { onConflict: "reference" }
          );

          // Mark as paid and trigger fulfillment
          await supabaseAdmin
            .from("orders")
            .update({ status: "paid", paystack_reference: reference })
            .eq("id", order.id);

          // Import fulfill and related helpers
          const { fulfill } = await import("@/lib/reseller.server");
          const { notifyAdmin } = await import("@/lib/notify.server");
          const { deliveredSms } = await import("@/lib/sms.server");

          const result = await fulfill({
            network: order.network,
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
              `✅ <b>Delivered</b> ${order.network} ${(order.data_mb / 1024).toFixed(1)}GB → ${order.recipient_phone}\nRef: ${result.reference}`,
            );
            await deliveredSms({
              phone: order.recipient_phone,
              network: order.network,
              dataMb: order.data_mb,
              orderId: order.id,
            });
          } else {
            await supabaseAdmin
              .from("orders")
              .update({ status: "failed", notes: result.error })
              .eq("id", order.id);
            await notifyAdmin(
              `❌ <b>Delivery failed</b> ${order.network} ${(order.data_mb / 1024).toFixed(1)}GB → ${order.recipient_phone}\nReason: ${result.error}`,
            );
          }
        }

        return new Response("ok");
      },
      GET: async () => new Response("Paystack webhook endpoint. POST only."),
    },
  },
});
