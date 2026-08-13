import assert from "node:assert/strict";
import test from "node:test";
import { getAuthErrorMessage } from "../lib/auth-errors.mjs";

test("explica el límite temporal de envío de correos", () => {
  const result = getAuthErrorMessage({ status: 429, code: "over_email_send_rate_limit" }, "login");

  assert.match(result, /limitó temporalmente/);
  assert.match(result, /Rate Limits/);
});

test("diferencia una cuenta no habilitada de un límite de correo", () => {
  const result = getAuthErrorMessage({ code: "signup_disabled", message: "Signups not allowed for otp" }, "login");

  assert.match(result, /no encontró una cuenta habilitada/);
  assert.doesNotMatch(result, /varios intentos/);
});

test("entrega una referencia segura para errores no reconocidos", () => {
  const result = getAuthErrorMessage({ code: "unexpected_failure" }, "login");

  assert.match(result, /unexpected_failure/);
  assert.match(result, /Authentication → Logs/);
});

test("explica credenciales inválidas y correo pendiente", () => {
  assert.match(getAuthErrorMessage({ code: "invalid_credentials" }, "login"), /contraseña no son correctos/);
  assert.match(getAuthErrorMessage({ code: "email_not_confirmed" }, "login"), /confirmar tu correo/);
});
