// bundles.functions.ts
// PATCH 3 — select original_price_ghs so offer-card.tsx can show a real
// crossed-out price instead of the misleading price * 1.10 fallback.
// cost_price_ghs is intentionally excluded — it is revoked from anon/authenticated
// at the DB level (migration 20260613042036) and must never reach the client.

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin }  from "@/integrations/supabase/client.server";

export const listActiveBundles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("bundles")
    .select("id, network, name, data_mb, price_ghs, original_price_ghs, validity, active, sort_order")
    .eq("active", true)
    .order("network")
    .order("sort_order")
    .order("data_mb");

  if (error) throw new Error(error.message);
  return { bundles: data ?? [] };
});
