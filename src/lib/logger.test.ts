import assert from "node:assert/strict";
import test from "node:test";
import { createRequestId, logger } from "./logger.ts";

test("createRequestId returns a non-empty correlation id", () => {
  assert.ok(createRequestId().length > 0);
});

test("logger emits the unified fields", () => {
  const originalInfo = console.info;
  let entry: unknown;

  console.info = (value?: unknown) => {
    entry = value;
  };

  try {
    logger.info({
      event: "test_succeeded",
      status: "success",
      message: "Test completed.",
      requestId: "request-123",
      userId: "user-123",
    });
  } finally {
    console.info = originalInfo;
  }

  assert.deepEqual(
    { ...(entry as Record<string, unknown>), timestamp: undefined },
    {
      event: "test_succeeded",
      status: "success",
      message: "Test completed.",
      timestamp: undefined,
      requestId: "request-123",
      userId: "user-123",
      creemCustomerId: null,
      creemSubscriptionId: null,
      creemProductId: null,
      errorMessage: null,
    },
  );
  assert.match(entryTimestamp(entry), /^\d{4}-\d{2}-\d{2}T/);
});

test("logger removes sensitive fields and normalizes errors", () => {
  const originalError = console.error;
  let entry: Record<string, unknown> | undefined;

  console.error = (value?: unknown) => {
    entry = value as Record<string, unknown>;
  };

  try {
    logger.error({
      event: "test_failed",
      status: "error",
      message: "Test failed.",
      requestId: "request-456",
      error: new Error("Provider unavailable"),
      password: "secret",
      token: "secret",
      apiKey: "secret",
      cardNumber: "4242424242424242",
      customerInput: "full user input",
      aiReply: "full AI response",
    });
  } finally {
    console.error = originalError;
  }

  assert.equal(entry?.errorName, "Error");
  assert.equal(entry?.errorMessage, "Provider unavailable");
  assert.equal("password" in (entry ?? {}), false);
  assert.equal("token" in (entry ?? {}), false);
  assert.equal("apiKey" in (entry ?? {}), false);
  assert.equal("cardNumber" in (entry ?? {}), false);
  assert.equal("customerInput" in (entry ?? {}), false);
  assert.equal("aiReply" in (entry ?? {}), false);
});

test("logger removes sensitive fields from nested metadata", () => {
  const originalInfo = console.info;
  let entry: Record<string, unknown> | undefined;

  console.info = (value?: unknown) => {
    entry = value as Record<string, unknown>;
  };

  try {
    logger.info({
      event: "nested_test",
      status: "success",
      message: "Nested metadata test.",
      requestId: "request-789",
      metadata: {
        plan: "free",
        credentials: { accessToken: "secret", region: "us-east" },
      },
    });
  } finally {
    console.info = originalInfo;
  }

  assert.deepEqual(entry?.metadata, {
    plan: "free",
    credentials: { region: "us-east" },
  });
});

function entryTimestamp(value: unknown) {
  return (value as { timestamp: string }).timestamp;
}
