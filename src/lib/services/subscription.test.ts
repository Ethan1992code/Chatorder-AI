import assert from "node:assert/strict";
import test from "node:test";
import {
  createSubscriptionService,
  isPremiumStatus,
  logFreeLimitReached,
} from "./subscription.ts";

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: "free" | "pro_monthly" | "pro_yearly" | "business";
  status:
    | "free"
    | "active"
    | "paid"
    | "trialing"
    | "scheduled_cancel"
    | "canceled"
    | "past_due"
    | "expired"
    | "paused";
  current_period_end: string | null;
  creem_customer_id?: string | null;
  creem_subscription_id?: string | null;
  creem_product_id?: string | null;
};

function database(subscription: SubscriptionRow | null) {
  let rpcInput: Record<string, unknown> | undefined;

  return {
    client: {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    return { data: subscription, error: null };
                  },
                };
              },
            };
          },
        };
      },
      async rpc(_name: string, input: Record<string, unknown>) {
        rpcInput = input;
        return { data: true, error: null };
      },
    },
    getRpcInput() {
      return rpcInput;
    },
  };
}

function logCollector() {
  const entries: Record<string, unknown>[] = [];
  return {
    entries,
    logger: {
      info(input: Record<string, unknown>) {
        entries.push(input);
      },
      error(input: Record<string, unknown>) {
        entries.push(input);
      },
    },
  };
}

const silentLogger = { info() {}, error() {} };

const baseSubscription: SubscriptionRow = {
  id: "subscription-1",
  user_id: "user-1",
  plan: "pro_monthly",
  status: "paid",
  current_period_end: "2026-07-01T00:00:00.000Z",
  creem_customer_id: "cust-1",
  creem_subscription_id: "sub-1",
  creem_product_id: "prod-1",
};

test("premium statuses follow the subscription access rules", () => {
  const now = new Date("2026-06-15T00:00:00.000Z");

  for (const status of ["paid", "active", "trialing"] as const) {
    assert.equal(isPremiumStatus(status, null, now), true);
  }

  assert.equal(
    isPremiumStatus("scheduled_cancel", "2026-07-01T00:00:00.000Z", now),
    true,
  );
  assert.equal(
    isPremiumStatus("scheduled_cancel", "2026-06-01T00:00:00.000Z", now),
    false,
  );

  for (const status of [
    "free",
    "canceled",
    "expired",
    "past_due",
    "paused",
  ] as const) {
    assert.equal(isPremiumStatus(status, null, now), false);
  }
});

test("missing subscriptions default to free", async () => {
  const db = database(null);
  const service = createSubscriptionService(() => db.client, silentLogger);

  assert.equal(await service.getUserSubscription("user-1"), null);
  assert.equal(await service.getUserPlan("user-1"), "free");
  assert.equal(await service.hasActiveSubscription("user-1"), false);
});

test("active paid plans are normalized to pro", async () => {
  const db = database(baseSubscription);
  const logs = logCollector();
  const service = createSubscriptionService(() => db.client, logs.logger);

  assert.equal(await service.getUserPlan("user-1"), "pro");
  assert.equal(await service.hasActiveSubscription("user-1"), true);
  assert.equal(logs.entries.at(-1)?.event, "premium_access_granted");
  assert.equal(logs.entries.at(-1)?.creemSubscriptionId, "sub-1");
});

test("inactive paid plans are treated as free", async () => {
  const db = database({ ...baseSubscription, status: "past_due" });
  const logs = logCollector();
  const service = createSubscriptionService(() => db.client, logs.logger);

  assert.equal(await service.getUserPlan("user-1"), "free");
  assert.equal(await service.hasActiveSubscription("user-1"), false);
  assert.equal(logs.entries.at(-1)?.event, "premium_access_denied");
});

test("missing subscriptions log that a subscription is required", async () => {
  const db = database(null);
  const logs = logCollector();
  const service = createSubscriptionService(() => db.client, logs.logger);

  assert.equal(await service.hasActiveSubscription("user-1"), false);
  assert.equal(logs.entries.at(-1)?.event, "subscription_required");
});

test("free limit exhaustion uses the centralized permission logger", () => {
  const logs = logCollector();
  logFreeLimitReached("user-1", logs.logger, "request-1");

  assert.deepEqual(logs.entries[0], {
    event: "free_limit_reached",
    status: "error",
    message: "The user reached the free usage limit.",
    userId: "user-1",
    requestId: "request-1",
  });
});

test("active business plans are normalized to business", async () => {
  const db = database({
    ...baseSubscription,
    plan: "business",
    status: "active",
  });
  const service = createSubscriptionService(() => db.client, silentLogger);

  assert.equal(await service.getUserPlan("user-1"), "business");
});

test("Creem events are persisted through the idempotent database function", async () => {
  const db = database(null);
  const service = createSubscriptionService(() => db.client, silentLogger);
  const event = {
    eventId: "evt_123",
    eventType: "subscription.paid",
    userId: "user-1",
    plan: "pro_monthly" as const,
    status: "paid" as const,
    creemCustomerId: "cust_123",
    creemSubscriptionId: "sub_123",
    creemProductId: "prod_123",
    currentPeriodStart: "2026-06-01T00:00:00.000Z",
    currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    nextTransactionDate: "2026-07-01T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    canceledAt: null,
    lastTransactionId: "tran_123",
  };

  assert.equal(await service.upsertSubscriptionFromCreemEvent(event), "processed");
  assert.deepEqual(db.getRpcInput(), {
    p_event_id: "evt_123",
    p_event_type: "subscription.paid",
    p_user_id: "user-1",
    p_plan: "pro_monthly",
    p_status: "paid",
    p_creem_customer_id: "cust_123",
    p_creem_subscription_id: "sub_123",
    p_creem_product_id: "prod_123",
    p_current_period_start: "2026-06-01T00:00:00.000Z",
    p_current_period_end: "2026-07-01T00:00:00.000Z",
    p_next_transaction_date: "2026-07-01T00:00:00.000Z",
    p_cancel_at_period_end: false,
    p_canceled_at: null,
    p_last_transaction_id: "tran_123",
  });
});
