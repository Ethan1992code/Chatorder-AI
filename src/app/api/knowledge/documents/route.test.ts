import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routePath = new URL("./route.ts", import.meta.url);

test("knowledge document route requires auth and saves through the RAG service", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.match(source, /saveKnowledgeDocument/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY.*body/);
});

test("knowledge document route lists saved documents for the signed-in user", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /export async function GET/);
  assert.match(source, /\.from\("knowledge_documents"\)/);
  assert.match(source, /\.eq\("user_id", user\.id\)/);
  assert.match(source, /documents:/);
});
