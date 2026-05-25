import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
