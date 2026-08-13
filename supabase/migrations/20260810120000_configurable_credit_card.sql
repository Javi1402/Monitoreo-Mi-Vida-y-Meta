begin;

alter table public.credit_cards
  drop constraint if exists credit_cards_credit_limit_check;

alter table public.credit_cards
  add column if not exists personal_spending_limit numeric(12,2);
alter table public.credit_cards
  add column if not exists payment_day smallint;

update public.credit_cards
set personal_spending_limit = credit_limit
where personal_spending_limit is null;

alter table public.credit_cards
  alter column personal_spending_limit set default 500,
  alter column personal_spending_limit set not null;

alter table public.credit_cards drop constraint if exists credit_cards_credit_limit_positive;
alter table public.credit_cards add constraint credit_cards_credit_limit_positive
  check (credit_limit > 0);

alter table public.credit_cards drop constraint if exists credit_cards_personal_spending_limit_check;
alter table public.credit_cards add constraint credit_cards_personal_spending_limit_check
  check (personal_spending_limit > 0 and personal_spending_limit <= credit_limit);

alter table public.credit_cards drop constraint if exists credit_cards_payment_day_check;
alter table public.credit_cards add constraint credit_cards_payment_day_check
  check (payment_day is null or payment_day between 1 and 31);

-- Las versiones anteriores creaban una tarjeta ficticia de S/500 al registrar
-- cada cuenta. Solo se desactivan esos registros intactos y sin movimientos.
update public.credit_cards
set is_active = false
where name = 'Tarjeta principal'
  and credit_limit = 500
  and personal_spending_limit = 500
  and opening_debt = 0
  and closing_date is null
  and due_date is null
  and payment_day is null;

-- Una cuenta nueva ya no debe recibir una tarjeta que no declaró tener.
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

commit;
