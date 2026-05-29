// TEST-MODE CHECKOUT — supports guest checkout.
// TODO: replace with real Paystack /transaction/initialize once approved.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fulfill } from "./reseller.server";
import { notifyAdmin } from "./notify.server";
import { deliveredSms } from "./sms.server";

export const payAndFulfill = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (oErr || !order) throw new Error("Order not found");
    if (order.status !== "pending") {
      return { status: order.status };
    }

    const reference = `TEST-${order.id.slice(0, 8)}-${Date.now()}`;

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      reference,
      amount_ghs: order.amount_ghs,
      status: "success",
      provider: "test-mode",
      metadata: { note: "Test checkout — Paystack pending approval" },
    });

    await supabaseAdmin
      .from("orders")
      .update({ status: "paid", paystack_reference: reference })
      .eq("id", order.id);

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
      return { status: "delivered" as const };
    }

    await supabaseAdmin
      .from("orders")
      .update({ status: "failed", notes: result.error })
      .eq("id", order.id);
    await notifyAdmin(
      `❌ <b>Delivery failed</b> ${order.network} ${(order.data_mb / 1024).toFixed(1)}GB → ${order.recipient_phone}\nReason: ${result.error}`,
    );
    return { status: "failed" as const, error: result.error };
  });
