// checkout.functions.ts
//
// Two separate server functions:
//   1. createPaystackTransaction — called by ALL customers to initialize Paystack,
//      stores the reference on the order, and returns the authorization_url for redirect.
//   2. payAndFulfill — ADMIN ONLY shortcut for offline test/manual fulfillment.
//      This is intentionally never called from the customer checkout flow.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fulfill } from "./reseller.server";
import { notifyAdmin } from "./notify.server";
import { deliveredSms } from "./sms.server";
import { initializePaystackTransaction } from "./paystack.server";

// ---------------------------------------------------------------------------
// Customer-facing: initialize a Paystack transaction for a pending order.
// Returns the authorization_url so the client can redirect the user.
// The reference is persisted to orders.paystack_reference BEFORE redirecting
// so the webhook can match the event when Paystack calls back.
// ---------------------------------------------------------------------------
export const createPaystackTransaction = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        orderId: z.string().uuid(),
        // Email required by Paystack — guest supplies it, or we use a placeholder.
        email: z.string().email().or(z.literal("")).transform((v) => v || "guest@elidataresales.com"),
        callbackUrl: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id, amount_ghs, status, paystack_reference")
      .eq("id", data.orderId)
      .single();
    if (oErr || !order) throw new Error("Order not found");
    if (order.status !== "pending") {
      throw new Error(`Order is already ${order.status} — cannot re-initialize payment`);
    }

    const result = await initializePaystackTransaction({
      amountGhs: Number(order.amount_ghs),
      email: data.email,
      orderId: data.orderId,
      callbackUrl: data.callbackUrl,
    });

    if (!result.ok) throw new Error(result.error);

    // Store the reference BEFORE redirecting so the webhook can find the order.
    const { error: upErr } = await supabaseAdmin
      .from("orders")
      .update({ paystack_reference: result.reference })
      .eq("id", data.orderId)
      .eq("status", "pending"); // Guard: only update if still pending
    if (upErr) throw new Error("Failed to store payment reference: " + upErr.message);

    return { authorizationUrl: result.authorizationUrl, reference: result.reference };
  });

// ---------------------------------------------------------------------------
// ADMIN ONLY — direct test/manual fulfillment that bypasses Paystack entirely.
// This is NEVER called from the customer checkout dialog.
// It requires the caller to be authenticated AND have the admin role.
// ---------------------------------------------------------------------------
export const payAndFulfill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    // Hard admin gate — double-checked even though middleware requires auth.
    const { data: roleRow, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr) throw new Error(roleErr.message);
    if (!roleRow) throw new Error("Forbidden: admin only");

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
      metadata: { note: "Admin test checkout — Paystack bypassed" },
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
        `✅ <b>Delivered (admin test)</b> ${order.network} ${(order.data_mb / 1024).toFixed(1)}GB → ${order.recipient_phone}\nRef: ${result.reference}`,
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
      `❌ <b>Delivery failed (admin test)</b> ${order.network} ${(order.data_mb / 1024).toFixed(1)}GB → ${order.recipient_phone}\nReason: ${result.error}`,
    );
    return { status: "failed" as const, error: result.error };
  });
