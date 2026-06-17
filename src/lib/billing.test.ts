import assert from "node:assert/strict";
import test from "node:test";
import { getBillingSummary } from "./billing.ts";

test("missing subscriptions display the Free plan", () => {
  assert.deepEqual(getBillingSummary(null), {
    plan: "Free",
    status: "free",
    isActive: false,
    currentPeriodEnd: null,
    nextTransactionDate: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    needsResubscribe: false,
    canManageSubscription: false,
  });
});

test("paid subscriptions display active Pro billing details", () => {
  const summary = getBillingSummary({
    id: "sub-1",
    user_id: "user-1",
    plan: "pro_yearly",
    status: "paid",
    current_period_end: "2026-07-01T00:00:00.000Z",
    next_transaction_date: "2026-07-01T00:00:00.000Z",
    cancel_at_period_end: false,
    canceled_at: null,
    creem_customer_id: "cust-1",
  });

  assert.equal(summary.plan, "Pro Yearly");
  assert.equal(summary.isActive, true);
  assert.equal(summary.needsResubscribe, false);
  assert.equal(summary.canManageSubscription, true);
});

test("billing issue statuses display a Pricing recovery action", () => {
  for (const status of ["canceled", "expired", "past_due", "paused"] as const) {
    const summary = getBillingSummary({
      id: "sub-1",
      user_id: "user-1",
      plan: "pro_monthly",
      status,
      current_period_end: null,
    });

    assert.equal(summary.isActive, false);
    assert.equal(summary.needsResubscribe, true);
  }
});
