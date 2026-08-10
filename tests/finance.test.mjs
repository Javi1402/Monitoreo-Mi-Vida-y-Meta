import assert from "node:assert/strict";
import test from "node:test";
import { calculateFinance } from "../lib/finance.mjs";

const base = {
  salary: 1_000,
  minimumGoal: 300,
  idealGoal: 500,
  creditLimit: 2_000,
  personalCardLimit: 500,
};

test("recalcula el saldo disponible con sueldo, extras, gastos y meta editable", () => {
  const result = calculateFinance({
    ...base,
    movements: [
      { type: "extra", amount: 100, method: "Yape" },
      { type: "expense", amount: 200, method: "Efectivo" },
    ],
  });

  assert.equal(result.balance, 900);
  assert.equal(result.spendableIdeal, 400);
  assert.equal(result.status, "green");
});

test("el pago de tarjeta reduce la deuda sin duplicar el gasto del periodo", () => {
  const result = calculateFinance({
    ...base,
    movements: [
      { type: "expense", amount: 300, method: "Tarjeta de crédito" },
      { type: "card_payment", amount: 120, method: "Cuenta bancaria" },
    ],
  });

  assert.equal(result.expenses, 300);
  assert.equal(result.balance, 700);
  assert.equal(result.cardDebt, 180);
  assert.equal(result.cardAvailable, 1_820);
  assert.equal(result.personalCardAvailable, 320);
});

test("clasifica la proyección con metas mínima e ideal variables", () => {
  const yellow = calculateFinance({ ...base, salary: 400, movements: [] });
  const red = calculateFinance({ ...base, salary: 250, movements: [] });

  assert.equal(yellow.status, "yellow");
  assert.equal(red.status, "red");
});

test("mantiene pendientes los cálculos diarios cuando no existe un periodo configurado", () => {
  const result = calculateFinance({
    salary: "",
    minimumGoal: 300,
    idealGoal: 500,
    movements: [],
  });

  assert.equal(result.hasActivePeriod, false);
  assert.equal(result.cardDebt, 0);
});
