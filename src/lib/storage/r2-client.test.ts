import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const clientPath = new URL("./r2-client.ts", import.meta.url);

test("R2 client upload requests a server signed URL before uploading to R2", () => {
  const source = readFileSync(clientPath, "utf8");

  assert.match(source, /\/api\/storage\/r2\/presigned-upload/);
  assert.match(source, /method:\s*"PUT"/);
  assert.doesNotMatch(source, /R2_SECRET_ACCESS_KEY/);
});
