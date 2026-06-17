import assert from "node:assert/strict";
import test from "node:test";
import { createAiUsageService } from "./ai-usage.ts";

function database(results: Array<boolean | null>) {
  const calls: Array<{ name: string; input: Record<string, unknown> }> = [];

  return {
    client: {
      async rpc(name: string, input: Record<string, unknown>) {
        calls.push({ name, input });
        return { data: results.shift() ?? null, error: null };
      },
    },
    calls,
  };
}

const silentLogger = { info() {}, error() {} };

test("free users reserve one of 20 replies in the current UTC month", async () => {
  const db = database([true]);
  const service = createAiUsageService({
    createDatabase: () => db.client,
    getUserPlan: async () => "free",
    now: () => new Date("2026-06-30T23:59:59.000Z"),
    logger: silentLogger,
  });

  assert.deepEqual(await service.reserveGenerateReply("user-1"), {
    allowed: true,
    usageMonth: "2026-06",
    limit: 20,
  });
  assert.deepEqual(db.calls[0], {
    name: "reserve_generate_reply_usage",
    input: {
      p_user_id: "user-1",
      p_usage_month: "2026-06",
      p_limit: 20,
    },
  });
});

test("pro users receive a 1000 reply monthly limit", async () => {
  const db = database([true]);
  const service = createAiUsageService({
    createDatabase: () => db.client,
    getUserPlan: async () => "pro",
    logger: silentLogger,
  });

  const reservation = await service.reserveGenerateReply("user-1");

  assert.equal(reservation.limit, 1000);
  assert.equal(db.calls[0]?.input.p_limit, 1000);
});

test("a full monthly allowance is denied without an AI call", async () => {
  const db = database([false]);
  const logs: Record<string, unknown>[] = [];
  const service = createAiUsageService({
    createDatabase: () => db.client,
    getUserPlan: async () => "free",
    logger: {
      info(input) {
        logs.push(input);
      },
      error(input) {
        logs.push(input);
      },
    },
  });

  const reservation = await service.reserveGenerateReply("user-1", "req-1");

  assert.equal(reservation.allowed, false);
  assert.equal(logs.at(-1)?.event, "free_limit_reached");
});

test("successful AI calls confirm the reservation", async () => {
  const db = database([true]);
  const service = createAiUsageService({
    createDatabase: () => db.client,
    getUserPlan: async () => "free",
    logger: silentLogger,
  });

  await service.confirmGenerateReply("user-1", "2026-06");

  assert.deepEqual(db.calls[0], {
    name: "confirm_generate_reply_usage",
    input: { p_user_id: "user-1", p_usage_month: "2026-06" },
  });
});

test("failed AI calls release the reservation without counting usage", async () => {
  const db = database([true]);
  const service = createAiUsageService({
    createDatabase: () => db.client,
    getUserPlan: async () => "free",
    logger: silentLogger,
  });

  await service.releaseGenerateReply("user-1", "2026-06");

  assert.deepEqual(db.calls[0], {
    name: "release_generate_reply_usage",
    input: { p_user_id: "user-1", p_usage_month: "2026-06" },
  });
});
