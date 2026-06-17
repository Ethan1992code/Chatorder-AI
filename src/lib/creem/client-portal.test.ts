import assert from "node:assert/strict";
import test from "node:test";
import { requestPortal } from "./client-portal.ts";

test("portal request sends no customer ID", async () => {
  let requestBody: BodyInit | null | undefined;
  const result = await requestPortal(async (_url, init) => {
    requestBody = init?.body;
    return Response.json({ portalUrl: "https://creem.io/portal" });
  });

  assert.equal(requestBody, undefined);
  assert.deepEqual(result, {
    status: "success",
    portalUrl: "https://creem.io/portal",
  });
});

test("portal request returns API errors", async () => {
  const result = await requestPortal(async () =>
    Response.json({ error: "No subscription to manage." }, { status: 400 }),
  );

  assert.deepEqual(result, {
    status: "error",
    message: "No subscription to manage.",
  });
});
