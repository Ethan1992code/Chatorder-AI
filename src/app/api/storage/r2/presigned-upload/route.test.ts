import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routePath = new URL("./route.ts", import.meta.url);

test("R2 presigned upload route requires auth and never accepts credentials from the client", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /createR2PresignedUploadUrl/);
  assert.doesNotMatch(source, /R2_SECRET_ACCESS_KEY.*body/);
  assert.doesNotMatch(source, /accessKeyId.*body/);
});
