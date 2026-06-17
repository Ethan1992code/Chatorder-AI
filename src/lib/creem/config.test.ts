import assert from "node:assert/strict";
import test from "node:test";
import { getCreemConfig } from "./config.ts";

const requiredEnv = {
  CREEM_API_KEY: "test-api-key",
  CREEM_WEBHOOK_SECRET: "test-webhook-secret",
  CREEM_PRODUCT_ID_PRO_MONTHLY: "prod_monthly",
  CREEM_PRODUCT_ID_PRO_YEARLY: "prod_yearly",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

test("development defaults to Creem test mode", () => {
  const config = getCreemConfig({
    ...requiredEnv,
    NODE_ENV: "development",
  });

  assert.equal(config.testMode, true);
});

test("production honors an explicit Creem test mode setting", () => {
  const config = getCreemConfig({
    ...requiredEnv,
    NODE_ENV: "production",
    CREEM_TEST_MODE: "true",
  });

  assert.equal(config.testMode, true);
});

test("production defaults to live mode", () => {
  const config = getCreemConfig({
    ...requiredEnv,
    NODE_ENV: "production",
  });

  assert.equal(config.testMode, false);
});

test("invalid Creem test mode values are rejected", () => {
  assert.throws(
    () =>
      getCreemConfig({
        ...requiredEnv,
        CREEM_TEST_MODE: "yes",
      }),
    /CREEM_TEST_MODE must be true or false/,
  );
});

test("missing required Creem variables are rejected", () => {
  assert.throws(
    () => getCreemConfig({ NODE_ENV: "development" }),
    /CREEM_API_KEY/,
  );
});
