import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el middleware deja pasar callbacks y páginas públicas de autenticación", async () => {
  const source = await readFile(new URL("../lib/supabase/middleware.js", import.meta.url), "utf8");

  assert.match(source, /startsWith\("\/auth\/"\)/);
  assert.match(source, /!isAuthCallback/);
  assert.match(source, /isPublicPage/);
});

test("el registro usa correo, contraseña y confirmación por callback", async () => {
  const source = await readFile(new URL("../app/login/page.js", import.meta.url), "utf8");

  assert.match(source, /emailRedirectTo: `\$\{window\.location\.origin\}\/auth\/confirm`/);
  assert.match(source, /signUp/);
  assert.match(source, /signInWithPassword/);
  assert.doesNotMatch(source, /signInWithOtp/);
});

test("la recuperación utiliza una pantalla dedicada para la contraseña nueva", async () => {
  const recover = await readFile(new URL("../app/recuperar-contrasena/page.js", import.meta.url), "utf8");
  const reset = await readFile(new URL("../app/restablecer-contrasena/page.js", import.meta.url), "utf8");
  assert.match(recover, /resetPasswordForEmail/);
  assert.match(recover, /next=\/restablecer-contrasena/);
  assert.match(reset, /updateUser\(\{ password \}\)/);
  assert.match(reset, /auth\.signOut/);
});
