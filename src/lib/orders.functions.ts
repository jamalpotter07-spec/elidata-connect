import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyAdmin } from "./notify.server";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9}$/, "Enter a valid 10-digit Ghana phone number starting with 0");

// Guest-friendly: works for signed-in users AND anonymous guests.
// If a Supabase access token is forwarded, we attribute the order to that user.
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        bundleId: z.string().uuid(),
        recipientPhone: phoneSchema,
        guestEmail: z.string().email().optional().or(z.literal("")).transform((v) => v || undefined),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    let userId: string | null = null;
    try {
      const req = getRequest();
      const auth = req?.headers.get("authorization");
      if (auth?.startsWith("Bearer ")) {
        const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
        userId = u.user?.id ?? null;
      }
    } catch {
      // no request context — treat as guest
    }

    const { data: bundle, error: bErr } = await supabaseAdmin
      .from("bundles")
      .select("id, network, data_mb, price_ghs, active")
      .eq("id", data.bundleId)
      .single();
    if (bErr || !bundle) throw new Error("Bundle not found");
    if (!bundle.active) throw new Error("Bundle is no longer available");

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        bundle_id: bundle.id,
        network: bundle.network,
        data_mb: bundle.data_mb,
        recipient_phone: data.recipientPhone,
        guest_email: userId ? null : data.guestEmail ?? null,
        amount_ghs: bundle.price_ghs,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await notifyAdmin(
      `🆕 <b>New order</b>\nNetwork: ${bundle.network}\nData: ${(bundle.data_mb / 1024).toFixed(1)} GB\nPhone: ${data.recipientPhone}\nAmount: GHS ${Number(bundle.price_ghs).toFixed(2)}\nOrder: <code>${order.id}</code>`,
    );
    return { orderId: order.id };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("orders")
      .select("id, network, data_mb, recipient_phone, amount_ghs, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { orders: data ?? [] };
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (error) throw new Error(error.message);
    return { order };
  });

// Public lookup by ID — for guests to track their order
export const getGuestOrder = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, network, data_mb, recipient_phone, amount_ghs, status, created_at, paystack_reference, reseller_reference")
      .eq("id", data.orderId)
      .single();
    if (error) throw new Error(error.message);
    return { order };
  });

// One-click re-order: re-create a new order from a previous one (same bundle + recipient).
export const reorderOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: prev, error } = await supabaseAdmin
      .from("orders")
      .select("bundle_id, recipient_phone, user_id")
      .eq("id", data.orderId)
      .single();
    if (error || !prev) throw new Error("Original order not found");
    if (prev.user_id && prev.user_id !== userId) throw new Error("Not your order");
    if (!prev.bundle_id) throw new Error("Original bundle missing");

    const { data: bundle, error: bErr } = await supabaseAdmin
      .from("bundles")
      .select("id, network, data_mb, price_ghs, active")
      .eq("id", prev.bundle_id)
      .single();
    if (bErr || !bundle) throw new Error("Bundle no longer exists");
    if (!bundle.active) throw new Error("Bundle is no longer available");

    const { data: order, error: insErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        bundle_id: bundle.id,
        network: bundle.network,
        data_mb: bundle.data_mb,
        recipient_phone: prev.recipient_phone,
        amount_ghs: bundle.price_ghs,
        status: "pending",
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);
    await notifyAdmin(
      `🔁 <b>Re-order</b> ${bundle.network} ${(bundle.data_mb / 1024).toFixed(1)} GB → ${prev.recipient_phone}\nOrder: <code>${order.id}</code>`,
    );
    return { orderId: order.id };
  });

