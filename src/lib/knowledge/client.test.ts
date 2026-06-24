import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const clientPath = new URL("./client.ts", import.meta.url);

test("knowledge client saves text documents through the server API", () => {
  const source = readFileSync(clientPath, "utf8");

  assert.match(source, /\/api\/knowledge\/documents/);
  assert.match(source, /method:\s*"POST"/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
});
