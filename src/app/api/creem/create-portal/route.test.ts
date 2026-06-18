import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routePath = new URL("./route.ts", import.meta.url);

test("Creem portal route uses the customer billing endpoint", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /\/v1\/customers\/billing/);
  assert.doesNotMatch(source, /\/v1\/customer-portal/);
});
