
-- 1) Hide bundles.cost_price_ghs from public reads (anon + authenticated).
REVOKE SELECT (cost_price_ghs) ON public.bundles FROM anon, authenticated;

-- 2) Block client-side writes to payments. RLS already denies (no policy),
--    but also revoke table-level privileges for defence in depth.
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;

-- 3) Lock down has_role() SECURITY DEFINER execution.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
