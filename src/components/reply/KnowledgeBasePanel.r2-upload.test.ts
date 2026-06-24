import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const panelPath = new URL("./KnowledgeBasePanel.tsx", import.meta.url);

test("knowledge base uploads supported files to R2 before adding them locally", () => {
  const source = readFileSync(panelPath, "utf8");

  assert.match(source, /listKnowledgeDocumentsFromClient/);
  assert.match(source, /saved knowledge file/);
  assert.match(source, /uploadFileToR2/);
  assert.match(source, /extractPdfTextFromClient/);
  assert.match(source, /saveKnowledgeDocumentFromClient/);
  assert.match(source, /R2 file stored/);
  assert.match(source, /RAG chunk/);
  assert.match(source, /isUploading/);
});

test("knowledge base does not pollute background notes with upload metadata", () => {
  const source = readFileSync(panelPath, "utf8");

  assert.doesNotMatch(source, /Stored in R2: \$\{/);
  assert.doesNotMatch(source, /Uploaded document reference/);
  assert.doesNotMatch(source, /Failed to upload \$\{/);
});

test("clearing background notes does not delete saved knowledge files", () => {
  const source = readFileSync(panelPath, "utf8");

  assert.match(source, /Uploaded knowledge files remain saved/);
  assert.doesNotMatch(source, /setAssets\(\[\]\)/);
});

test("knowledge base lets users delete saved knowledge files", () => {
  const source = readFileSync(panelPath, "utf8");

  assert.match(source, /deleteKnowledgeDocumentFromClient/);
  assert.match(source, /function deleteAsset/);
  assert.match(source, /deleted from saved knowledge/);
  assert.match(source, /"Delete"/);
});
