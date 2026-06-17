import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routePath = new URL("./route.ts", import.meta.url);

test("generate reply reserves quota before calling the AI provider", () => {
  const source = readFileSync(routePath, "utf8");
  const reservationIndex = source.indexOf("reserveGenerateReply(");
  const providerIndex = source.indexOf("await fetch(");

  assert.ok(reservationIndex >= 0);
  assert.ok(providerIndex > reservationIndex);
});

test("generate reply exposes the monthly limit response contract", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /MONTHLY_LIMIT_REACHED/);
  assert.match(source, /403/);
});

test("generate reply confirms successes and releases failed reservations", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /confirmGenerateReply\(/);
  assert.match(source, /releaseGenerateReply\(/);
});
