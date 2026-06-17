import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = new URL(
  "../../../supabase/migrations/202606150001_create_subscriptions.sql",
  import.meta.url,
);

test("subscription migration includes identity and lookup constraints", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(sql, /create table if not exists public\.subscriptions/i);
  assert.match(sql, /user_id uuid not null references auth\.users\s*\(id\)/i);
  assert.match(sql, /unique\s*\(user_id\)/i);
  assert.match(sql, /unique\s*\(creem_subscription_id\)/i);
  assert.match(sql, /index.*creem_customer_id/i);
});

test("subscription migration limits plans and statuses", () => {
  const sql = readFileSync(migrationPath, "utf8");

  for (const plan of ["free", "pro_monthly", "pro_yearly", "business"]) {
    assert.match(sql, new RegExp(`'${plan}'`));
  }

  for (const status of [
    "free",
    "active",
    "paid",
    "trialing",
    "scheduled_cancel",
    "canceled",
    "past_due",
    "expired",
    "paused",
  ]) {
    assert.match(sql, new RegExp(`'${status}'`));
  }
});

test("webhook events are idempotent and subscription data uses RLS", () => {
  const sql = readFileSync(migrationPath, "utf8");

  assert.match(
    sql,
    /create table if not exists public\.processed_webhook_events/i,
  );
  assert.match(sql, /event_id text not null unique/i);
  assert.match(sql, /alter table public\.subscriptions enable row level security/i);
  assert.match(sql, /auth\.uid\(\) = user_id/i);
  assert.match(
    sql,
    /alter table public\.processed_webhook_events enable row level security/i,
  );
});
