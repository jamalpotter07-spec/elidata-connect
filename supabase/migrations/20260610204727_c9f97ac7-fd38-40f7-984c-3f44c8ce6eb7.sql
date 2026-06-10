create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove prior schedules with the same name (safe re-run)
do $$
declare j record;
begin
  for j in select jobname from cron.job where jobname in ('daily-profit-report','mobigh-balance-check') loop
    perform cron.unschedule(j.jobname);
  end loop;
end $$;

select cron.schedule(
  'daily-profit-report',
  '55 23 * * *',
  $$
  select net.http_post(
    url:='https://project--f9d6d78d-9dd8-4bd2-bcfe-bd24e87531f3-dev.lovable.app/api/public/hooks/daily-profit',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

select cron.schedule(
  'mobigh-balance-check',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://project--f9d6d78d-9dd8-4bd2-bcfe-bd24e87531f3-dev.lovable.app/api/public/hooks/balance-check',
    headers:='{"Content-Type":"application/json"}'::jsonb,
    body:='{"threshold":50}'::jsonb
  );
  $$
);