import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../../../supabase/migrations/202606150002_process_creem_webhook.sql",
    import.meta.url,
  ),
  "utf8",
);

test("webhook processing function claims the event and updates atomically", () => {
  assert.match(migration, /create or replace function public\.process_creem_webhook/i);
  assert.match(migration, /insert into public\.processed_webhook_events/i);
  assert.match(migration, /on conflict \(event_id\) do nothing/i);
  assert.match(migration, /insert into public\.subscriptions/i);
  assert.match(migration, /on conflict \(user_id\) do update/i);
  assert.match(
    migration,
    /excluded\.status\s*=\s*'active'[\s\S]*existing\.status\s*=\s*'paid'/i,
  );
  assert.match(migration, /grant execute[\s\S]*service_role/i);
});
