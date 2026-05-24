import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listActiveBundles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("bundles")
    .select("id, network, name, data_mb, price_ghs, validity, active, sort_order")
    .eq("active", true)
    .order("network")
    .order("sort_order")
    .order("data_mb");
  if (error) throw new Error(error.message);
  return { bundles: data ?? [] };
});
