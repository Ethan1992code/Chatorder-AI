import assert from "node:assert/strict";
import test from "node:test";
import { requestCheckout } from "./client-checkout.ts";

test("checkout request sends only the selected plan key", async () => {
  let requestBody = "";
  const fetcher: typeof fetch = async (_input, init) => {
    requestBody = String(init?.body);
    return Response.json({ checkoutUrl: "https://checkout.creem.io/test" });
  };

  const result = await requestCheckout("pro_monthly", fetcher);

  assert.deepEqual(JSON.parse(requestBody), { planKey: "pro_monthly" });
  assert.deepEqual(result, {
    status: "success",
    checkoutUrl: "https://checkout.creem.io/test",
  });
});

test("checkout request identifies an unauthenticated user", async () => {
  const fetcher: typeof fetch = async () =>
    Response.json({ error: "Please log in." }, { status: 401 });

  const result = await requestCheckout("pro_yearly", fetcher);

  assert.deepEqual(result, { status: "unauthorized" });
});

test("checkout request returns a useful error", async () => {
  const fetcher: typeof fetch = async () =>
    Response.json({ error: "Checkout unavailable." }, { status: 502 });

  const result = await requestCheckout("pro_monthly", fetcher);

  assert.deepEqual(result, {
    status: "error",
    message: "Checkout unavailable.",
  });
});
