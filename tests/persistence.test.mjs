import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/page.js", import.meta.url);

test("recupera el periodo abierto y sus movimientos desde Supabase", async () => {
  const source = await readFile(pageUrl, "utf8");

  assert.match(source, /from\("financial_periods"\).*eq\("status", "open"\)/);
  assert.match(source, /from\("transactions"\).*eq\("period_id", period\.id\)/);
});

test("guarda el primer periodo y cada movimiento en Supabase", async () => {
  const source = await readFile(pageUrl, "utf8");

  assert.match(source, /from\("financial_periods"\)\.insert/);
  assert.match(source, /from\("transactions"\)\.insert/);
  assert.match(source, /user_id: userId/);
});

test("impide guardar movimientos sin un periodo activo", async () => {
  const source = await readFile(pageUrl, "utf8");

  assert.match(source, /if \(!activePeriodId \|\| !userId\)/);
  assert.match(source, /Configura primero el ingreso de tu periodo/);
});
