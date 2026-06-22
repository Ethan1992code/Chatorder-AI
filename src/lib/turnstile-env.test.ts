import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const examplePath = new URL("../../.env.example", import.meta.url);

test("environment example documents the public Turnstile site key", () => {
  const source = readFileSync(examplePath, "utf8");

  assert.match(source, /NEXT_PUBLIC_TURNSTILE_SITE_KEY=/);
});
