import assert from "node:assert/strict";
import test from "node:test";
import { createPortalHandler } from "./create-portal.ts";

const silentLogger = { info() {}, error() {} };

function request(body?: unknown) {
  return new Request("https://example.com/api/creem/create-portal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test("portal creation requires an authenticated user", async () => {
  const handler = createPortalHandler({
    getUser: async () => null,
    getCustomerId: async () => "cust_123",
    createPortal: async () => ({ portalUrl: "https://creem.io/portal" }),
    logger: silentLogger,
  });

  assert.equal((await handler(request())).status, 401);
});

test("portal creation rejects client supplied fields", async () => {
  const handler = createPortalHandler({
    getUser: async () => ({ id: "user-1" }),
    getCustomerId: async () => "cust_123",
    createPortal: async () => ({ portalUrl: "https://creem.io/portal" }),
    logger: silentLogger,
  });

  const response = await handler(request({ creemCustomerId: "cust_attacker" }));
  assert.equal(response.status, 400);
});

test("portal creation returns 400 when the user has no Creem customer", async () => {
  const handler = createPortalHandler({
    getUser: async () => ({ id: "user-1" }),
    getCustomerId: async () => null,
    createPortal: async () => ({ portalUrl: "https://creem.io/portal" }),
    logger: silentLogger,
  });

  const response = await handler(request());
  const body = (await response.json()) as { error?: string };

  assert.equal(response.status, 400);
  assert.match(body.error ?? "", /no subscription/i);
});

test("portal creation uses the database customer ID", async () => {
  let receivedCustomerId = "";
  const handler = createPortalHandler({
    getUser: async () => ({ id: "user-1" }),
    getCustomerId: async (userId) => {
      assert.equal(userId, "user-1");
      return "cust_database";
    },
    createPortal: async (customerId) => {
      receivedCustomerId = customerId;
      return { portalUrl: "https://creem.io/my-orders/login/test" };
    },
    logger: silentLogger,
  });

  const response = await handler(request());
  const body = (await response.json()) as { portalUrl?: string };

  assert.equal(response.status, 200);
  assert.equal(receivedCustomerId, "cust_database");
  assert.equal(body.portalUrl, "https://creem.io/my-orders/login/test");
});
