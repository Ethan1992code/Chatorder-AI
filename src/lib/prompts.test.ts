import assert from "node:assert/strict";
import test from "node:test";
import { buildSalesReplyPrompt, salesReplySystemPrompt } from "./prompts.ts";

test("sales reply prompt requires exact specs from retrieved knowledge", () => {
  assert.match(salesReplySystemPrompt, /Saved knowledge base facts are authoritative/);
  assert.match(salesReplySystemPrompt, /recommended_reply and short_reply/);

  const prompt = buildSalesReplyPrompt({
    customerMessage: "How long does the battery last?",
    productName: "GPS tracker",
    productInfo: "Outdoor tracker",
    platform: "Instagram",
    customerStage: "New inquiry",
    tone: "Friendly",
    language: "English",
    businessContext: "Retrieved knowledge: Battery life is 100 hours.",
  });

  assert.match(prompt, /first source for product facts/);
  assert.match(prompt, /battery life/);
  assert.match(prompt, /exact value/);
});
