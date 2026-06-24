import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const clientPath = new URL("./client.ts", import.meta.url);

test("knowledge client saves text documents through the server API", () => {
  const source = readFileSync(clientPath, "utf8");

  assert.match(source, /\/api\/knowledge\/documents/);
  assert.match(source, /method:\s*"POST"/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/);
});

test("knowledge client lists saved documents through the server API", () => {
  const source = readFileSync(clientPath, "utf8");

  assert.match(source, /listKnowledgeDocumentsFromClient/);
  assert.match(source, /method:\s*"GET"/);
  assert.match(source, /documents/);
});

test("knowledge client deletes saved documents through the server API", () => {
  const source = readFileSync(clientPath, "utf8");

  assert.match(source, /deleteKnowledgeDocumentFromClient/);
  assert.match(source, /method:\s*"DELETE"/);
  assert.match(source, /encodeURIComponent\(documentId\)/);
});

test("knowledge client extracts PDF text through the server API", () => {
  const source = readFileSync(clientPath, "utf8");

  assert.match(source, /\/api\/knowledge\/extract-pdf/);
  assert.match(source, /FormData/);
  assert.match(source, /sourceUrl/);
});
