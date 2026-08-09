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
