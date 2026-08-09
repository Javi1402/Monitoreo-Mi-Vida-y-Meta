-- MVM: esquema inicial con aislamiento completo por usuario.
-- Ejecutar desde Supabase SQL Editor como una sola migración.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  currency text not null default 'PEN' check (currency = 'PEN'),
  timezone text not null default 'America/Lima',
  usual_salary numeric(12,2) check (usual_salary is null or usual_salary >= 0),
  minimum_saving_goal numeric(12,2) not null default 300 check (minimum_saving_goal >= 0),
  ideal_saving_goal numeric(12,2) not null default 500 check (ideal_saving_goal >= minimum_saving_goal),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.financial_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null,
  end_date date,
  expected_next_pay_date date,
  opening_income numeric(12,2) not null check (opening_income > 0),
  minimum_saving_goal numeric(12,2) not null default 300 check (minimum_saving_goal >= 0),
  ideal_saving_goal numeric(12,2) not null default 500 check (ideal_saving_goal >= minimum_saving_goal),
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_at timestamptz,
  transferred_to_savings numeric(12,2) not null default 0 check (transferred_to_savings >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check ((status = 'open' and end_date is null and closed_at is null) or status = 'closed')
);

create unique index one_open_period_per_user
  on public.financial_periods(user_id)
  where status = 'open';

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  type text not null default 'expense' check (type in ('expense', 'income')),
  color text,
  icon text,
  monthly_limit numeric(12,2) check (monthly_limit is null or monthly_limit >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name, type),
  unique (id, user_id)
);

create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Tarjeta principal',
  credit_limit numeric(12,2) not null default 500 check (credit_limit = 500),
  opening_debt numeric(12,2) not null default 0 check (opening_debt between 0 and credit_limit),
  recommended_available_minimum numeric(12,2) not null default 200 check (recommended_available_minimum >= 0),
  recommended_available_maximum numeric(12,2) not null default 300 check (recommended_available_maximum >= recommended_available_minimum),
  closing_date date,
  due_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create unique index one_active_card_per_user
  on public.credit_cards(user_id)
  where is_active;

create table public.recurring_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  amount numeric(12,2) not null check (amount > 0),
  category_id uuid,
  payment_method text not null check (payment_method in ('cash', 'yape', 'plin', 'bank_account', 'credit_card')),
  due_day smallint not null check (due_day between 1 and 31),
  mode text not null check (mode in ('automatic', 'manual')),
  is_active boolean not null default true,
  last_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (category_id, user_id) references public.categories(id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_id uuid not null,
  type text not null check (type in ('extra_income', 'expense', 'credit_card_payment', 'savings_transfer')),
  amount numeric(12,2) not null check (amount > 0),
  category_id uuid,
  payment_method text check (payment_method in ('cash', 'yape', 'plin', 'bank_account', 'credit_card')),
  transaction_date date not null,
  description text check (description is null or char_length(description) <= 240),
  credit_card_id uuid,
  recurring_payment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (period_id, user_id) references public.financial_periods(id, user_id) on delete restrict,
  foreign key (category_id, user_id) references public.categories(id, user_id),
  foreign key (credit_card_id, user_id) references public.credit_cards(id, user_id),
  foreign key (recurring_payment_id, user_id) references public.recurring_payments(id, user_id)
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read', 'dismissed')),
  scheduled_for timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index financial_periods_user_date_idx on public.financial_periods(user_id, start_date desc);
create index transactions_period_date_idx on public.transactions(period_id, transaction_date desc);
create index transactions_user_idx on public.transactions(user_id);
create index recurring_payments_user_idx on public.recurring_payments(user_id) where is_active;
create index alerts_user_status_idx on public.alerts(user_id, status, scheduled_for);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger periods_set_updated_at before update on public.financial_periods
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger cards_set_updated_at before update on public.credit_cards
for each row execute function public.set_updated_at();
create trigger recurring_set_updated_at before update on public.recurring_payments
for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
for each row execute function public.set_updated_at();

create or replace function public.initialize_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (target_user_id)
  on conflict (id) do nothing;

  insert into public.credit_cards (user_id)
  values (target_user_id)
  on conflict do nothing;

  insert into public.categories (user_id, name, color, icon)
  select target_user_id, item.name, item.color, item.icon
  from (values
    ('Alimentación', '#46cf83', 'utensils'),
    ('Transporte', '#7cbbf6', 'bus'),
    ('Vivienda', '#5d9cec', 'house'),
    ('Servicios', '#48c9b0', 'receipt'),
    ('Aplicaciones y suscripciones', '#9b8afb', 'apps'),
    ('Salud', '#ef767a', 'heart'),
    ('Belleza', '#e78ac3', 'sparkles'),
    ('Ropa', '#ba8df4', 'shirt'),
    ('Entretenimiento', '#f5b84b', 'ticket'),
    ('Viajes', '#45b7d1', 'plane'),
    ('Deudas', '#f07c57', 'wallet'),
    ('Otros', '#8f9b98', 'dots')
  ) as item(name, color, icon)
  on conflict (user_id, name, type) do nothing;
end;
$$;

revoke all on function public.initialize_user_data(uuid) from public, anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.initialize_user_data(new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Inicializa también las cuentas creadas antes de ejecutar esta migración.
do $$
declare
  existing_user record;
begin
  for existing_user in select id from auth.users loop
    perform public.initialize_user_data(existing_user.id);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.financial_periods enable row level security;
alter table public.categories enable row level security;
alter table public.credit_cards enable row level security;
alter table public.recurring_payments enable row level security;
alter table public.transactions enable row level security;
alter table public.alerts enable row level security;

create policy profiles_owner_all on public.profiles
for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy periods_owner_all on public.financial_periods
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy categories_owner_all on public.categories
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy cards_owner_all on public.credit_cards
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy recurring_owner_all on public.recurring_payments
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy transactions_owner_all on public.transactions
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy alerts_owner_all on public.alerts
for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.financial_periods to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.credit_cards to authenticated;
grant select, insert, update, delete on public.recurring_payments to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.alerts to authenticated;
