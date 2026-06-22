import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authFormPath = new URL("./AuthForm.tsx", import.meta.url);

test("auth form passes the Turnstile token to Supabase auth", () => {
  const source = readFileSync(authFormPath, "utf8");

  assert.match(source, /captchaToken/);
  assert.match(source, /signInWithPassword\([\s\S]*options:\s*{\s*captchaToken/);
  assert.match(source, /signUp\([\s\S]*options:\s*{[\s\S]*captchaToken/);
});
