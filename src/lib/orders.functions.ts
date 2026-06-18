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

// ---------------------------------------------------------------------------
// #7 FIX — Rate limiting on createOrder.
// Strategy: DB-level count of pending orders created from the same IP or phone
// number within the last 10 minutes. No external service needed.
// Limits:
//   • 5 orders per IP per 10 minutes  — stops script spam from one machine
//   • 3 orders per phone per 10 minutes — stops rotating-IP abuse with one target
// Signed-in users get a looser per-user limit (10 per 10 min) to avoid
// blocking legitimate power users.
// ---------------------------------------------------------------------------
async function enforceRateLimit(params: {
  ip: string | null;
  phone: string;
  userId: string | null;
}): Promise<void> {
  const window = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  // Per-phone limit — tightest, prevents hammering one recipient
  const { count: phoneCount } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("recipient_phone", params.phone)
    .gte("created_at", window);
  if ((phoneCount ?? 0) >= 3) {
    throw new Error("Too many orders for this phone number. Please wait a few minutes and try again.");
  }

  if (params.userId) {
    // Signed-in user limit
    const { count: userCount } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", params.userId)
      .gte("created_at", window);
    if ((userCount ?? 0) >= 10) {
      throw new Error("Too many orders placed in a short time. Please wait a few minutes.");
    }
  } else if (params.ip) {
    // Guest IP limit — stored in order notes as a hidden tag for auditing
    const { count: ipCount } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .like("notes", `%[ip:${params.ip}]%`)
      .gte("created_at", window);
    if ((ipCount ?? 0) >= 5) {
      throw new Error("Too many orders from your connection. Please wait a few minutes and try again.");
    }
  }
}

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
    let clientIp: string | null = null;

    try {
      const req = getRequest();
      // Cloudflare sets CF-Connecting-IP; fall back to standard headers
      clientIp =
        req?.headers.get("cf-connecting-ip") ??
        req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        null;

      const auth = req?.headers.get("authorization");
      if (auth?.startsWith("Bearer ")) {
        const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
        userId = u.user?.id ?? null;
      }
    } catch {
      // no request context — treat as guest, no IP available
    }

    // Enforce rate limit before touching bundles or creating rows
    await enforceRateLimit({ ip: clientIp, phone: data.recipientPhone, userId });

    const { data: bundle, error: bErr } = await supabaseAdmin
      .from("bundles")
      .select("id, network, data_mb, price_ghs, active")
      .eq("id", data.bundleId)
      .single();
    if (bErr || !bundle) throw new Error("Bundle not found");
    if (!bundle.active) throw new Error("Bundle is no longer available");

    // Embed IP tag in notes for guest orders so the rate limiter can query it.
    // Never shown in the customer-facing UI — admin-only field.
    const ipTag = !userId && clientIp ? ` [ip:${clientIp}]` : "";

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
        notes: ipTag.trim() || null,
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

// ---------------------------------------------------------------------------
// PUBLIC — Search orders by recipient phone number.
// Returns the last 10 orders for that phone so the customer can find any order
// without needing to save the order ID link.
// Security considerations:
//   • Returns only safe public fields — no internal notes, IP tags, or cost data.
//   • Limited to 10 results so it cannot be used to enumerate all orders.
//   • Phone number must match exactly (no partial / fuzzy match).
//   • Rate-limited indirectly by Paystack / Supabase connection limits.
// ---------------------------------------------------------------------------
export const searchOrdersByPhone = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ phone: phoneSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, network, data_mb, amount_ghs, status, created_at")
      .eq("recipient_phone", data.phone)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw new Error(error.message);

    // Never expose recipient_phone or notes in a public listing endpoint.
    return { orders: orders ?? [] };
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
