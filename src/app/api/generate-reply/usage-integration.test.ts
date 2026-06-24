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

test("generate reply retrieves saved RAG context before building the AI prompt", () => {
  const source = readFileSync(routePath, "utf8");
  const retrievalIndex = source.indexOf("retrieveComprehensiveKnowledgeContext(");
  const promptIndex = source.indexOf("buildSalesReplyPrompt(inputWithRag)");

  assert.ok(retrievalIndex >= 0);
  assert.ok(promptIndex > retrievalIndex);
});

test("generate reply logs matched and full RAG context counts", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /ragMatchedChunkCount/);
  assert.match(source, /ragFullContextChunkCount/);
});

test("generate reply returns short knowledge source snippets for debugging", () => {
  const source = readFileSync(routePath, "utf8");

  assert.match(source, /function buildKnowledgeSources/);
  assert.match(source, /knowledge_sources/);
  assert.match(source, /slice\(0, 360\)/);
});
