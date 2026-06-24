import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRagQuery,
  chunkKnowledgeText,
  createRagService,
  formatRagContext,
} from "./rag.ts";

const silentLogger = { info() {}, error() {} };

test("RAG chunks long text into bounded overlapping chunks", () => {
  const chunks = chunkKnowledgeText("a".repeat(2500));

  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 1200));
});

test("RAG query combines the customer message and product context", () => {
  assert.equal(
    buildRagQuery({
      customerMessage: "Do you ship to Canada?",
      productName: "Phone case",
      productInfo: "MagSafe compatible",
    }),
    "Do you ship to Canada? Phone case MagSafe compatible",
  );
});

test("RAG formats retrieved chunks for the prompt", () => {
  const context = formatRagContext([
    {
      document_id: "doc-1",
      chunk_id: "chunk-1",
      title: "Shipping FAQ",
      content: "We ship to Canada in 5-8 days.",
      rank: 0.5,
    },
  ]);

  assert.match(context, /Retrieved knowledge/);
  assert.match(context, /authoritative product facts/);
  assert.match(context, /Shipping FAQ/);
  assert.match(context, /Canada/);
});

test("RAG service saves documents and retrieves matches", async () => {
  const calls: Array<{ table?: string; rpc?: string; input: unknown }> = [];
  const database = {
    from(table: string) {
      return {
        insert(input: unknown) {
          calls.push({ table, input });

          if (table === "knowledge_documents") {
            return {
              select() {
                return {
                  async single() {
                    return { data: { id: "doc-1" }, error: null };
                  },
                };
              },
            };
          }

          return Promise.resolve({ data: null, error: null });
        },
      };
    },
    async rpc(name: string, input: Record<string, unknown>) {
      calls.push({ rpc: name, input });
      return {
        data: [
          {
            document_id: "doc-1",
            chunk_id: "chunk-1",
            title: "FAQ",
            content: "Warranty is one year.",
            rank: 0.4,
          },
        ],
        error: null,
      };
    },
  };
  const service = createRagService(() => database as never, silentLogger);

  const saved = await service.saveKnowledgeDocument("user-1", {
    title: "FAQ",
    content: "Warranty is one year.",
  });
  const retrieved = await service.retrieveKnowledgeContext(
    "user-1",
    "warranty",
  );

  assert.equal(saved.documentId, "doc-1");
  assert.equal(saved.chunkCount, 1);
  assert.equal(retrieved.matches.length, 1);
  assert.equal(calls.at(-1)?.rpc, "match_knowledge_chunks");
  assert.deepEqual(calls.at(-1)?.input, {
    p_user_id: "user-1",
    p_query: "warranty",
    p_limit: 6,
  });
});
