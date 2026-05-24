import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9}$/, "Enter a valid 10-digit Ghana phone number starting with 0");

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        bundleId: z.string().uuid(),
        recipientPhone: phoneSchema,
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: bundle, error: bErr } = await supabase
      .from("bundles")
      .select("id, network, data_mb, price_ghs, active")
      .eq("id", data.bundleId)
      .single();
    if (bErr || !bundle) throw new Error("Bundle not found");
    if (!bundle.active) throw new Error("Bundle is no longer available");

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        bundle_id: bundle.id,
        network: bundle.network,
        data_mb: bundle.data_mb,
        recipient_phone: data.recipientPhone,
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
