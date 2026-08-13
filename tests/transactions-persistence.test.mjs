import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/page.js", import.meta.url);

test("carga los movimientos persistidos del periodo activo", async () => {
  const source = await readFile(pageUrl, "utf8");
  assert.match(source, /from\("transactions"\)\.select/);
  assert.match(source, /\.eq\("period_id", period\.id\)/);
  assert.match(source, /setMovements\(\(storedMovements \|\| \[\]\)\.map/);
  assert.match(source, /transactionTypesFromDatabase/);
  assert.match(source, /paymentMethodsFromDatabase/);
});

test("guarda cada movimiento en Supabase antes de actualizar la interfaz", async () => {
  const source = await readFile(pageUrl, "utf8");
  assert.match(source, /from\("transactions"\)\.insert\(values\)/);
  assert.match(source, /period_id: periodId/);
  assert.match(source, /category_id: form\.type === "expense"/);
  assert.match(source, /transaction_date: form\.date/);
  const insertPosition = source.indexOf('from("transactions").insert(values)');
  const statePosition = source.indexOf("setMovements((current)", insertPosition);
  assert.ok(insertPosition >= 0 && statePosition > insertPosition);
});

test("informa el error y no finge que un movimiento fue guardado", async () => {
  const source = await readFile(pageUrl, "utf8");
  assert.match(source, /if \(error\) return setNotice\("No pudimos guardar el movimiento/);
  assert.match(source, /disabled=\{movementSaving\}/);
});
