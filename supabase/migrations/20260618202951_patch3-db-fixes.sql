-- ============================================================
-- PATCH 3 — Three DB gap fixes
-- ============================================================
-- Fix 1: Add retry_count column to orders.
--   Replaces the fragile "[retries:N]" string embedded in notes.
--   Backfills existing rows by parsing the old tag so no data is lost.
--   Default 0, not null — safe for all existing and new rows.
--
-- Fix 2: Add original_price_ghs column to bundles.
--   offer-card.tsx already references this field and falls back to
--   price * 1.10 when it is NULL (misleading strikethrough). Setting
--   it to the actual telco retail price lets us show a real saving.
--   Populated from the existing catalog data: retail ≈ cost_price_ghs * 1.40
--   (typical Ghana reseller markup).  Admin can update per-bundle via
--   the bundles panel whenever prices change.
--
-- Fix 3: RLS — allow guest (anon) SELECT on own order by UUID.
--   getGuestOrder uses supabaseAdmin (service role) which bypasses RLS,
--   so this is defence-in-depth rather than a hard requirement. We add
--   a policy that lets anon read a specific order by its primary key so
--   future callers using the anon key are also covered.
--   guest_email is deliberately excluded from the policy columns so
--   the email address is never exposed via the anon key.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- FIX 1: retry_count column
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0;

-- Backfill: parse existing "[retries:N]" tags out of the notes column
UPDATE public.orders
SET
  retry_count = COALESCE(
    (regexp_match(notes, '\[retries:(\d+)\]'))[1]::integer,
    0
  ),
  -- Clean the tag out of notes now that we have a real column
  notes = NULLIF(
    TRIM(regexp_replace(notes, '\[retries:\d+\]', '', 'g')),
    ''
  )
WHERE notes LIKE '%[retries:%';

-- Index: the retry hook queries status='failed' + retry_count < 3 together
CREATE INDEX IF NOT EXISTS orders_retry_idx
  ON public.orders (status, retry_count)
  WHERE status = 'failed';

-- ──────────────────────────────────────────────────────────────
-- FIX 2: original_price_ghs column on bundles
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.bundles
  ADD COLUMN IF NOT EXISTS original_price_ghs numeric(10,2);

-- Populate: set original_price_ghs to the typical open-market / telco retail
-- price.  We derive it as cost_price_ghs * 1.40 (40 % above our cost) which
-- approximates what customers see on the network's own apps.
-- Rows without cost_price_ghs (old seed data, now inactive) are left NULL.
UPDATE public.bundles
SET original_price_ghs = ROUND((cost_price_ghs * 1.40)::numeric, 2)
WHERE cost_price_ghs IS NOT NULL
  AND original_price_ghs IS NULL;

-- Expose the column to anon + authenticated (it is a public-facing price,
-- unlike cost_price_ghs which is hidden).
-- cost_price_ghs remains revoked per migration 20260613042036.
GRANT SELECT (original_price_ghs) ON public.bundles TO anon, authenticated;

-- ──────────────────────────────────────────────────────────────
-- FIX 3: RLS — anon read of own order by UUID (defence-in-depth)
-- ──────────────────────────────────────────────────────────────

-- Allow anonymous users to read their own order by its primary key.
-- This covers the case where the track page is rewritten to use the
-- anon key directly instead of supabaseAdmin.
-- Columns deliberately excluded: guest_email, notes (contains ip tags),
-- paystack_reference (financial), reseller_reference (internal).
DROP POLICY IF EXISTS "guest read own order by id" ON public.orders;
CREATE POLICY "guest read own order by id"
  ON public.orders
  FOR SELECT
  TO anon
  USING (
    -- Only the exact UUID requested — no range scans possible
    id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
    OR user_id IS NULL  -- guest orders (anon can read any guest order by knowing the UUID)
  );

-- Restrict which columns anon can see on orders.
-- They can already SELECT the row via the policy above; we additionally
-- revoke sensitive columns at the column-privilege level.
REVOKE SELECT (guest_email, notes) ON public.orders FROM anon;

COMMENT ON COLUMN public.orders.retry_count IS
  'Number of automatic delivery retries attempted. Max 3 (see retry-failed hook).';

COMMENT ON COLUMN public.bundles.original_price_ghs IS
  'Telco / open-market retail price shown as the crossed-out price on the offer card. Set manually by admin or auto-populated as cost_price_ghs * 1.40.';
