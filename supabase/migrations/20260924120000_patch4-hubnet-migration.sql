-- ============================================================
-- PATCH 4 — Hubnet renovation (fulfillment provider swap)
-- ============================================================
-- Fix 1: rename the balance-check cron job. It now monitors Hubnet's
--   wallet (the one that funds live deliveries) instead of Mobigh's —
--   the route body already changed in balance-check.ts; this just keeps
--   the job label in `cron.job` honest.
--
-- Fix 2: index to support retry-failed.ts's new "stuck in processing"
--   query. Previously that hook only ever looked at status='failed', so
--   orders that got stuck mid-delivery after a crash/timeout were
--   invisible to it forever. The existing orders_retry_idx is a partial
--   index scoped to status='failed' and doesn't cover this new query.
-- ============================================================

do $$
declare j record;
begin
  for j in select jobname from cron.job where jobname = 'mobigh-balance-check' loop
    perform cron.unschedule(j.jobname);
  end loop;
end $$;

select cron.schedule(
  'hubnet-balance-check',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://project--f9d6d78d-9dd8-4bd2-bcfe-bd24e87531f3-dev.lovable.app/api/public/hooks/balance-check',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{"threshold":50}'::jsonb
  );
  $$
);

CREATE INDEX IF NOT EXISTS orders_stuck_processing_idx
  ON public.orders (updated_at)
  WHERE status = 'processing';

COMMENT ON INDEX orders_stuck_processing_idx IS
  'Supports retry-failed.ts picking up orders stuck in "processing" after a crashed/timed-out delivery attempt (Hubnet renovation, patch 4).';
