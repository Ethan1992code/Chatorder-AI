import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL(
  "../../../supabase/migrations/202606240001_create_knowledge_rag.sql",
  import.meta.url,
);

test("knowledge RAG migration creates documents and chunks", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.knowledge_documents/i);
  assert.match(sql, /create table if not exists public\.knowledge_chunks/i);
  assert.match(sql, /user_id uuid not null references auth\.users\s*\(id\)/i);
  assert.match(sql, /search_vector tsvector generated always/i);
  assert.match(sql, /using gin \(search_vector\)/i);
});

test("knowledge RAG migration defines user-scoped retrieval", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /create or replace function public\.match_knowledge_chunks/i);
  assert.match(sql, /where c\.user_id = p_user_id/i);
  assert.match(sql, /plainto_tsquery\('simple'/i);
  assert.match(sql, /alter table public\.knowledge_documents enable row level security/i);
  assert.match(sql, /auth\.uid\(\) = user_id/i);
});
