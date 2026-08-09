import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el middleware deja pasar la ruta que confirma el enlace mágico", async () => {
  const source = await readFile(new URL("../lib/supabase/middleware.js", import.meta.url), "utf8");

  assert.match(source, /startsWith\("\/auth\/"\)/);
  assert.match(source, /!isAuthCallback/);
});

test("el formulario envía el retorno a la ruta de confirmación", async () => {
  const source = await readFile(new URL("../app/login/page.js", import.meta.url), "utf8");

  assert.match(source, /emailRedirectTo: `\$\{window\.location\.origin\}\/auth\/confirm`/);
  assert.doesNotMatch(source, /verifyOtp/);
});

test("recupera enlaces que Supabase envía por error a la raíz", async () => {
  const source = await readFile(new URL("../lib/supabase/middleware.js", import.meta.url), "utf8");

  assert.match(source, /pathname === "\/" && authorizationCode/);
  assert.match(source, /mvm_recovery_pending/);
  assert.match(source, /isPasswordRecovery \? "\/auth\/recover" : "\/auth\/confirm"/);
  assert.match(source, /searchParams\.set\("code", authorizationCode\)/);
});

test("la recuperación usa una ruta separada para crear la contraseña", async () => {
  const login = await readFile(new URL("../app/login/page.js", import.meta.url), "utf8");
  const recovery = await readFile(new URL("../app/auth/recover/route.js", import.meta.url), "utf8");

  assert.match(login, /resetPasswordForEmail/);
  assert.match(login, /\/auth\/recover/);
  assert.match(login, /mvm_recovery_pending=1/);
  assert.match(recovery, /exchangeCodeForSession/);
  assert.match(recovery, /\/account\/password/);
  assert.match(recovery, /cookies\.delete\("mvm_recovery_pending"\)/);
});

test("el acceso habitual usa contraseña y no solicita enlaces mágicos", async () => {
  const login = await readFile(new URL("../app/login/page.js", import.meta.url), "utf8");

  assert.match(login, /signInWithPassword/);
  assert.match(login, /auth\.signUp/);
  assert.doesNotMatch(login, /signInWithOtp/);
});

test("no anuncia un correo de registro para una cuenta que ya existe", async () => {
  const login = await readFile(new URL("../app/login/page.js", import.meta.url), "utf8");

  assert.match(login, /data\.user\.identities\.length === 0/);
  assert.match(login, /Este correo ya está registrado/);
});
