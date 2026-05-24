
-- Fix search_path on trigger functions
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- Revoke execute from anon/authenticated on security-definer functions
revoke execute on function public.has_role(uuid, app_role) from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
