import assert from "node:assert/strict";
import test from "node:test";
import {
  getCreemProductIdByPlanKey,
  getPaidPlanByKey,
  getPlanByKey,
  isPaidPlan,
  plans,
} from "./plans.ts";

test("defines the four requested plans", () => {
  assert.deepEqual(
    plans.map((plan) => plan.planKey),
    ["free", "pro_monthly", "pro_yearly", "business"],
  );

  assert.equal(getPlanByKey("free")?.aiRepliesPerMonth, 20);
  assert.equal(getPlanByKey("pro_monthly")?.price, 9);
  assert.equal(getPlanByKey("pro_yearly")?.price, 90);
  assert.equal(getPlanByKey("business")?.aiRepliesPerMonth, "custom");
});

test("returns null for an unknown plan key", () => {
  assert.equal(getPlanByKey("missing"), null);
  assert.equal(getPaidPlanByKey("missing"), null);
});

test("only self-service Pro plans are paid plans", () => {
  assert.equal(isPaidPlan("free"), false);
  assert.equal(isPaidPlan("pro_monthly"), true);
  assert.equal(isPaidPlan("pro_yearly"), true);
  assert.equal(isPaidPlan("business"), false);
  assert.equal(isPaidPlan("missing"), false);

  assert.equal(getPaidPlanByKey("free"), null);
  assert.equal(getPaidPlanByKey("business"), null);
  assert.equal(getPaidPlanByKey("pro_monthly")?.planKey, "pro_monthly");
});

test("maps paid plan keys to server environment product IDs", () => {
  const environment = {
    CREEM_PRODUCT_ID_PRO_MONTHLY: "prod_monthly",
    CREEM_PRODUCT_ID_PRO_YEARLY: "prod_yearly",
  };

  assert.equal(
    getCreemProductIdByPlanKey("pro_monthly", environment),
    "prod_monthly",
  );
  assert.equal(
    getCreemProductIdByPlanKey("pro_yearly", environment),
    "prod_yearly",
  );
});

test("rejects checkout for plans without a Creem product", () => {
  assert.throws(
    () => getCreemProductIdByPlanKey("free", {}),
    /cannot be purchased through checkout/,
  );
  assert.throws(
    () => getCreemProductIdByPlanKey("business", {}),
    /cannot be purchased through checkout/,
  );
  assert.throws(
    () => getCreemProductIdByPlanKey("missing", {}),
    /Unknown plan key/,
  );
});

test("rejects checkout when a paid product ID is not configured", () => {
  assert.throws(
    () => getCreemProductIdByPlanKey("pro_monthly", {}),
    /CREEM_PRODUCT_ID_PRO_MONTHLY is not configured/,
  );
});
