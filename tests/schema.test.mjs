import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/20260809180000_initial_schema.sql", import.meta.url);
const cardMigrationUrl = new URL("../supabase/migrations/20260810120000_configurable_credit_card.sql", import.meta.url);

test("activa RLS y crea una política para cada tabla personal", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  const tables = ["profiles", "financial_periods", "categories", "credit_cards", "recurring_payments", "transactions", "alerts"];

  for (const table of tables) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security;`));
    assert.match(sql, new RegExp(`create policy [a-z_]+ on public\\.${table}`));
  }
});

test("permite una línea bancaria y un límite personal configurables", async () => {
  const sql = await readFile(cardMigrationUrl, "utf8");
  assert.match(sql, /personal_spending_limit numeric\(12,2\)/);
  assert.match(sql, /personal_spending_limit <= credit_limit/);
  assert.match(sql, /payment_day between 1 and 31/);
  assert.match(sql, /drop constraint if exists credit_cards_credit_limit_check/);
});

test("no crea una tarjeta automática para cuentas nuevas", async () => {
  const sql = await readFile(cardMigrationUrl, "utf8");
  const replacement = sql.slice(sql.indexOf("create or replace function public.initialize_user_data"));
  assert.doesNotMatch(replacement, /insert into public\.credit_cards/);
});

test("vincula los registros relacionados al mismo propietario", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /foreign key \(period_id, user_id\) references public\.financial_periods\(id, user_id\)/);
  assert.match(sql, /foreign key \(category_id, user_id\) references public\.categories\(id, user_id\)/);
  assert.match(sql, /with check \(user_id = \(select auth\.uid\(\)\)\)/);
});

test("no incluye credenciales administrativas", async () => {
  const sql = `${await readFile(migrationUrl, "utf8")}\n${await readFile(cardMigrationUrl, "utf8")}`;

  assert.doesNotMatch(sql, /service_role/i);
});
