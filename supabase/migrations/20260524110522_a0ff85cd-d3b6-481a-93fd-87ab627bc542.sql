
-- Enums
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.network as enum ('MTN', 'Telecel', 'AT');
create type public.order_status as enum ('pending', 'paid', 'processing', 'delivered', 'failed', 'refunded');
create type public.payment_status as enum ('pending', 'success', 'failed', 'abandoned');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- has_role security definer
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Bundles
create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  network network not null,
  name text not null,
  data_mb integer not null check (data_mb > 0),
  price_ghs numeric(10,2) not null check (price_ghs > 0),
  validity text not null default '30 days',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bundles enable row level security;

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bundle_id uuid not null references public.bundles(id),
  network network not null,
  data_mb integer not null,
  recipient_phone text not null,
  amount_ghs numeric(10,2) not null,
  status order_status not null default 'pending',
  paystack_reference text unique,
  reseller_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create index orders_user_id_idx on public.orders(user_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reference text not null unique,
  amount_ghs numeric(10,2) not null,
  status payment_status not null default 'pending',
  provider text not null default 'paystack',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create index payments_order_id_idx on public.payments(order_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_updated_at_profiles before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at_bundles before update on public.bundles for each row execute function public.set_updated_at();
create trigger set_updated_at_orders before update on public.orders for each row execute function public.set_updated_at();
create trigger set_updated_at_payments before update on public.payments for each row execute function public.set_updated_at();

-- Auto-create profile + default role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'phone');
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS Policies

-- profiles
create policy "users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "admins view all profiles" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "admins update profiles" on public.profiles for update using (public.has_role(auth.uid(), 'admin'));

-- user_roles
create policy "users view own roles" on public.user_roles for select using (auth.uid() = user_id);
create policy "admins view all roles" on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- bundles (public read of active; admin full)
create policy "anyone view active bundles" on public.bundles for select using (active = true);
create policy "admins view all bundles" on public.bundles for select using (public.has_role(auth.uid(), 'admin'));
create policy "admins manage bundles" on public.bundles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- orders
create policy "users view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "users create own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "admins view all orders" on public.orders for select using (public.has_role(auth.uid(), 'admin'));
create policy "admins manage orders" on public.orders for update using (public.has_role(auth.uid(), 'admin'));

-- payments
create policy "users view own payments" on public.payments for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "admins view all payments" on public.payments for select using (public.has_role(auth.uid(), 'admin'));

-- Seed sample bundles
insert into public.bundles (network, name, data_mb, price_ghs, validity, sort_order) values
('MTN', '1GB', 1024, 5.50, '30 days', 1),
('MTN', '2GB', 2048, 10.50, '30 days', 2),
('MTN', '5GB', 5120, 25.00, '30 days', 3),
('MTN', '10GB', 10240, 48.00, '30 days', 4),
('Telecel', '1GB', 1024, 5.00, '30 days', 1),
('Telecel', '2GB', 2048, 10.00, '30 days', 2),
('Telecel', '5GB', 5120, 24.00, '30 days', 3),
('AT', '1GB', 1024, 4.80, '30 days', 1),
('AT', '2GB', 2048, 9.50, '30 days', 2),
('AT', '5GB', 5120, 23.00, '30 days', 3);
