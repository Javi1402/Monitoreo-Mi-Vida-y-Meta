import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el cliente móvil persiste y renueva la sesión", async () => {
  const source = await readFile(new URL("../apps/mobile/lib/supabase.js", import.meta.url), "utf8");
  assert.match(source, /storage: AsyncStorage/);
  assert.match(source, /persistSession: true/);
  assert.match(source, /autoRefreshToken: true/);
  assert.match(source, /flowType: "pkce"/);
});

test("la app móvil declara identidad para Android, iOS y enlaces profundos", async () => {
  const config = JSON.parse(await readFile(new URL("../apps/mobile/app.json", import.meta.url), "utf8"));
  assert.equal(config.expo.name, "Monitoreo Vida y Meta");
  assert.equal(config.expo.scheme, "mvm");
  assert.equal(config.expo.android.package, "com.mvm.monitoreovidaymeta");
  assert.equal(config.expo.ios.bundleIdentifier, "com.mvm.monitoreovidaymeta");
});

test("registro, acceso y recuperación móvil utilizan contraseña", async () => {
  const register = await readFile(new URL("../apps/mobile/app/registro.js", import.meta.url), "utf8");
  const login = await readFile(new URL("../apps/mobile/app/login.js", import.meta.url), "utf8");
  const recovery = await readFile(new URL("../apps/mobile/app/recuperar.js", import.meta.url), "utf8");
  assert.match(register, /auth\.signUp/);
  assert.match(login, /auth\.signInWithPassword/);
  assert.match(recovery, /resetPasswordForEmail/);
});
