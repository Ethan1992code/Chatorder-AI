import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { createCreemWebhookHandler } from "./webhook.ts";

const secret = "test-webhook-secret";

const silentLogger = {
  info() {},
  error() {},
};

function signedRequest(payload: Record<string, unknown>, signatureSecret = secret) {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", signatureSecret)
    .update(body)
    .digest("hex");

  return new Request("https://example.com/api/webhooks/creem", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "creem-signature": signature,
    },
    body,
  });
}

function subscriptionEvent(
  eventType: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: `evt_${eventType}`,
    eventType,
    created_at: 1728734327355,
    object: {
      id: "sub_123",
      product: { id: "prod_monthly" },
      customer: { id: "cust_123" },
      current_period_start_date: "2026-06-01T00:00:00.000Z",
      current_period_end_date: "2026-07-01T00:00:00.000Z",
      next_transaction_date: "2026-07-01T00:00:00.000Z",
      last_transaction_id: "tran_123",
      canceled_at: null,
      metadata: { userId: "00000000-0000-4000-8000-000000000123" },
      ...overrides,
    },
  };
}

const environment = {
  CREEM_WEBHOOK_SECRET: secret,
  CREEM_PRODUCT_ID_PRO_MONTHLY: "prod_monthly",
  CREEM_PRODUCT_ID_PRO_YEARLY: "prod_yearly",
};

test("rejects an invalid signature before processing the event", async () => {
  let calls = 0;
  const handler = createCreemWebhookHandler({
    processEvent: async () => {
      calls += 1;
      return "processed";
    },
    environment,
    logger: silentLogger,
  });

  const response = await handler(
    signedRequest(subscriptionEvent("subscription.paid"), "wrong-secret"),
  );

  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test("returns 200 without reprocessing a duplicate event", async () => {
  const handler = createCreemWebhookHandler({
    processEvent: async () => "duplicate",
    environment,
    logger: silentLogger,
  });

  const response = await handler(
    signedRequest(subscriptionEvent("subscription.paid")),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: true, duplicate: true });
});

test("maps subscription.paid to a paid Pro subscription", async () => {
  let input: Record<string, unknown> | undefined;
  const handler = createCreemWebhookHandler({
    processEvent: async (event) => {
      input = event;
      return "processed";
    },
    environment,
    logger: silentLogger,
  });

  const response = await handler(
    signedRequest(subscriptionEvent("subscription.paid")),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(input, {
    eventId: "evt_subscription.paid",
    eventType: "subscription.paid",
    userId: "00000000-0000-4000-8000-000000000123",
    plan: "pro_monthly",
    status: "paid",
    creemCustomerId: "cust_123",
    creemSubscriptionId: "sub_123",
    creemProductId: "prod_monthly",
    currentPeriodStart: "2026-06-01T00:00:00.000Z",
    currentPeriodEnd: "2026-07-01T00:00:00.000Z",
    nextTransactionDate: "2026-07-01T00:00:00.000Z",
    cancelAtPeriodEnd: false,
    canceledAt: null,
    lastTransactionId: "tran_123",
  });
});

test("synchronizes active without converting it to paid", async () => {
  let input: Record<string, unknown> | undefined;
  const handler = createCreemWebhookHandler({
    processEvent: async (event) => {
      input = event;
      return "processed";
    },
    environment,
    logger: silentLogger,
  });

  await handler(signedRequest(subscriptionEvent("subscription.active")));

  assert.equal(input?.status, "active");
});

test("records checkout completion without assigning a subscription status", async () => {
  let input: Record<string, unknown> | undefined;
  const handler = createCreemWebhookHandler({
    processEvent: async (event) => {
      input = event;
      return "processed";
    },
    environment,
    logger: silentLogger,
  });

  await handler(
    signedRequest({
      id: "evt_checkout",
      eventType: "checkout.completed",
      created_at: 1728734327355,
      object: {
        product: { id: "prod_monthly" },
        customer: { id: "cust_123" },
        subscription: { id: "sub_123" },
        metadata: { userId: "00000000-0000-4000-8000-000000000123" },
      },
    }),
  );

  assert.equal(input?.status, null);
  assert.equal(input?.creemSubscriptionId, "sub_123");
});

test("maps subscription lifecycle events to access-safe statuses", async () => {
  const statuses = new Map<string, unknown>();
  const handler = createCreemWebhookHandler({
    processEvent: async (event) => {
      statuses.set(String(event.eventType), event.status);
      return "processed";
    },
    environment,
    logger: silentLogger,
  });

  for (const [eventType, status] of [
    ["subscription.scheduled_cancel", "scheduled_cancel"],
    ["subscription.canceled", "canceled"],
    ["subscription.past_due", "past_due"],
    ["subscription.expired", "expired"],
  ]) {
    await handler(signedRequest(subscriptionEvent(eventType)));
    assert.equal(statuses.get(eventType), status);
  }
});

test("logs every requested subscription lifecycle event with Creem identifiers", async () => {
  const entries: Record<string, unknown>[] = [];
  const handler = createCreemWebhookHandler({
    processEvent: async () => "processed",
    environment,
    logger: {
      info(input) { entries.push(input); },
      error(input) { entries.push(input); },
    },
  });

  for (const eventType of [
    "subscription.paid",
    "subscription.active",
    "subscription.scheduled_cancel",
    "subscription.canceled",
    "subscription.past_due",
    "subscription.expired",
  ]) {
    await handler(signedRequest(subscriptionEvent(eventType)));
  }

  const lifecycleEvents = entries.filter((entry) =>
    String(entry.event).startsWith("creem_subscription_"),
  );
  assert.deepEqual(
    lifecycleEvents.map((entry) => entry.event),
    [
      "creem_subscription_paid",
      "creem_subscription_active",
      "creem_subscription_scheduled_cancel",
      "creem_subscription_canceled",
      "creem_subscription_past_due",
      "creem_subscription_expired",
    ],
  );
  assert.equal(lifecycleEvents[0]?.creemCustomerId, "cust_123");
  assert.equal(lifecycleEvents[0]?.creemSubscriptionId, "sub_123");
  assert.equal(lifecycleEvents[0]?.creemProductId, "prod_monthly");
});

test("marks refund and dispute subscriptions as past due", async () => {
  const statuses: unknown[] = [];
  const handler = createCreemWebhookHandler({
    processEvent: async (event) => {
      statuses.push(event.status);
      return "processed";
    },
    environment,
    logger: silentLogger,
  });
  const riskObject = {
    subscription: {
      id: "sub_123",
      product: "prod_monthly",
      customer: "cust_123",
      metadata: { referenceId: "00000000-0000-4000-8000-000000000123" },
    },
    transaction: { id: "tran_123", subscription: "sub_123" },
  };

  for (const eventType of ["refund.created", "dispute.created"]) {
    await handler(
      signedRequest({
        id: `evt_${eventType}`,
        eventType,
        created_at: 1728734327355,
        object: riskObject,
      }),
    );
  }

  assert.deepEqual(statuses, ["past_due", "past_due"]);
});
