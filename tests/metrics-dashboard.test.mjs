import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/page.js", import.meta.url);

test("métricas permite desplegar y ocultar todas las categorías", async () => {
  const source = await readFile(pageUrl, "utf8");
  assert.match(source, /showAllCategories/);
  assert.match(source, /Ver todas las categorías/);
  assert.match(source, /Ocultar dashboard completo/);
  assert.match(source, /aria-expanded=\{showAllCategories\}/);
});

test("el dashboard ordena categorías y calcula porcentaje y total", async () => {
  const source = await readFile(pageUrl, "utf8");
  assert.match(source, /second\.total - first\.total/);
  assert.match(source, /percentage: finance\.expenses \? total \/ finance\.expenses \* 100 : 0/);
  assert.match(source, /categoryMetrics\.map/);
  assert.match(source, /Categorías con gastos/);
  assert.match(source, /Mayor categoría/);
});
