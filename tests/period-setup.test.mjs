import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/page.js", import.meta.url);

test("el formulario solicita el periodo sin próximo pago esperado", async () => {
  const source = await readFile(pageUrl, "utf8");
  assert.match(source, /Monto principal del periodo/);
  assert.match(source, /Fecha de inicio del periodo/);
  assert.match(source, /Meta mínima de ahorro/);
  assert.match(source, /Meta ideal de ahorro/);
  assert.doesNotMatch(source, />Próximo pago estimado</);
});

test("la tarjeta solicita línea total, límite personal y fecha mensual", async () => {
  const source = await readFile(pageUrl, "utf8");
  assert.match(source, /Tarjeta de crédito contratada/);
  assert.match(source, /Línea total de crédito/);
  assert.match(source, /Límite personal de gasto/);
  assert.match(source, /Fecha siempre a pagar/);
  assert.match(source, /personalLimit > bankLimit/);
});

test("la planificación persiste el periodo y la tarjeta en Supabase", async () => {
  const source = await readFile(pageUrl, "utf8");
  assert.match(source, /from\("financial_periods"\)\.insert/);
  assert.match(source, /from\("credit_cards"\)\.insert/);
  assert.match(source, /personal_spending_limit: personalLimit/);
  assert.match(source, /payment_day: payDay/);
});
