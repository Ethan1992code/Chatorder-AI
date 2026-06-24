import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routePath = new URL("./route.ts", import.meta.url);

test("PDF extraction route requires auth and uses pdf-parse", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /PDFParse/);
  assert.match(source, /formData/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY.*formData/);
});
