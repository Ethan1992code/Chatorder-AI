import assert from "node:assert/strict";
import test from "node:test";
import { createCheckoutHandler } from "./create-checkout.ts";

const environment = {
  CREEM_API_KEY: "test-api-key",
  CREEM_WEBHOOK_SECRET: "test-webhook-secret",
  CREEM_PRODUCT_ID_PRO_MONTHLY: "prod_monthly",
  CREEM_PRODUCT_ID_PRO_YEARLY: "prod_yearly",
  NEXT_PUBLIC_APP_URL: "https://example.com",
  CREEM_TEST_MODE: "true",
};

const silentLogger = {
  info() {},
  error() {},
};

function request(body: unknown) {
  return new Request("https://example.com/api/creem/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("requires an authenticated user", async () => {
  const handler = createCheckoutHandler({
    getUser: async () => null,
    createCheckout: async () => ({ checkoutUrl: "https://checkout.test" }),
    environment,
    logger: silentLogger,
  });

  const response = await handler(request({ planKey: "pro_monthly" }));

  assert.equal(response.status, 401);
});

test("rejects unknown and non-checkout plan keys", async () => {
  const handler = createCheckoutHandler({
    getUser: async () => ({ id: "user-123" }),
    createCheckout: async () => ({ checkoutUrl: "https://checkout.test" }),
    environment,
    logger: silentLogger,
  });

  for (const planKey of ["missing", "free", "business"]) {
    const response = await handler(request({ planKey }));
    assert.equal(response.status, 400);
  }
});

test("rejects a client supplied Creem product ID", async () => {
  const handler = createCheckoutHandler({
    getUser: async () => ({ id: "user-123" }),
    createCheckout: async () => ({ checkoutUrl: "https://checkout.test" }),
    environment,
    logger: silentLogger,
  });

  const response = await handler(
    request({ planKey: "pro_monthly", creemProductId: "prod_attacker" }),
  );

  assert.equal(response.status, 400);
});

test("creates checkout from the server plan mapping", async () => {
  let checkoutInput: Record<string, unknown> | undefined;
  const handler = createCheckoutHandler({
    getUser: async () => ({ id: "user-123" }),
    createCheckout: async (input) => {
      checkoutInput = input;
      return { checkoutUrl: "https://checkout.creem.io/test" };
    },
    environment,
    logger: silentLogger,
  });

  const response = await handler(request({ planKey: "pro_yearly" }));
  const body = (await response.json()) as { checkoutUrl?: string };

  assert.equal(response.status, 200);
  assert.equal(body.checkoutUrl, "https://checkout.creem.io/test");
  assert.equal(checkoutInput?.productId, "prod_yearly");
  assert.equal(
    checkoutInput?.successUrl,
    "https://example.com/billing/success",
  );
  assert.deepEqual(checkoutInput?.metadata, {
    userId: "user-123",
    referenceId: "user-123",
    planKey: "pro_yearly",
  });
});

test("returns a clear server error when Creem checkout creation fails", async () => {
  const handler = createCheckoutHandler({
    getUser: async () => ({ id: "user-123" }),
    createCheckout: async () => {
      throw new Error("Creem unavailable");
    },
    environment,
    logger: silentLogger,
  });

  const response = await handler(request({ planKey: "pro_monthly" }));
  const body = (await response.json()) as { error?: string };

  assert.equal(response.status, 502);
  assert.equal(body.error, "Could not create checkout. Please try again.");
});
