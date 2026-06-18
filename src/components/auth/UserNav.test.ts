import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const userNavPath = new URL("./UserNav.tsx", import.meta.url);

test("authenticated app navigation links to billing", () => {
  const source = readFileSync(userNavPath, "utf8");

  assert.match(source, /href="\/billing"/);
  assert.match(source, />\s*Billing\s*</);
});
