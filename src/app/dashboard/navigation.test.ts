import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const dashboardPath = new URL("./page.tsx", import.meta.url);

test("dashboard exposes billing and pricing entry points", () => {
  const source = readFileSync(dashboardPath, "utf8");

  assert.match(source, /href="\/billing"/);
  assert.match(source, />\s*Billing\s*</);
  assert.match(source, /href="\/pricing"/);
  assert.match(source, />\s*View plans\s*</);
});
