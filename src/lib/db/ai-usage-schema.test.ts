import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL(
  "../../../supabase/migrations/202606150003_create_ai_usage_monthly.sql",
  import.meta.url,
);

test("monthly AI usage is unique per user and calendar month", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.ai_usage_monthly/i);
  assert.match(sql, /user_id uuid not null references auth\.users\s*\(id\)/i);
  assert.match(sql, /usage_month text not null/i);
  assert.match(sql, /unique\s*\(user_id, usage_month\)/i);
  assert.match(sql, /generate_reply_count integer not null default 0/i);
  assert.match(sql, /pending_generate_reply_count integer not null default 0/i);
});

test("usage functions reserve, confirm, and release quota atomically", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /create or replace function public\.reserve_generate_reply_usage/i);
  assert.match(sql, /on conflict \(user_id, usage_month\) do update/i);
  assert.match(
    sql,
    /generate_reply_count \+[\s\S]*pending_generate_reply_count[\s\S]*< p_limit/i,
  );
  assert.match(sql, /create or replace function public\.confirm_generate_reply_usage/i);
  assert.match(sql, /generate_reply_count = generate_reply_count \+ 1/i);
  assert.match(sql, /pending_generate_reply_count = pending_generate_reply_count - 1/i);
  assert.match(sql, /create or replace function public\.release_generate_reply_usage/i);
});
