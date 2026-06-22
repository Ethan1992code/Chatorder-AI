import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const examplePath = new URL("../../../.env.example", import.meta.url);

test("environment example documents Cloudflare R2 server variables", () => {
  const source = readFileSync(examplePath, "utf8");

  assert.match(source, /R2_ACCOUNT_ID=/);
  assert.match(source, /R2_ACCESS_KEY_ID=/);
  assert.match(source, /R2_SECRET_ACCESS_KEY=/);
  assert.match(source, /R2_BUCKET_NAME=/);
  assert.match(source, /R2_PUBLIC_BASE_URL=/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_R2_SECRET/);
});
