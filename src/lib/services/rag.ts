import { logger as defaultLogger } from "../logger.ts";
import { createAdminClient } from "../supabase/admin.ts";

const MAX_DOCUMENT_TEXT_LENGTH = 60_000;
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 160;
const MAX_CHUNKS_PER_DOCUMENT = 40;
const DEFAULT_MATCH_LIMIT = 3;

export type KnowledgeDocumentInput = {
  title: string;
  content: string;
  sourceKey?: string | null;
  sourceUrl?: string | null;
  contentType?: string | null;
};

export type KnowledgeChunkMatch = {
  document_id: string;
  chunk_id: string;
  title: string;
  content: string;
  rank: number;
};

type InsertResult<T> = PromiseLike<{ data: T; error: unknown }>;

type RagDatabase = {
  from(table: "knowledge_documents"): {
    insert(input: Record<string, unknown>): {
      select(columns: string): {
        single(): InsertResult<{ id: string }>;
      };
    };
  };
  from(table: "knowledge_chunks"): {
    insert(input: Array<Record<string, unknown>>): InsertResult<unknown>;
  };
  rpc(
    name: "match_knowledge_chunks",
    input: Record<string, unknown>,
  ): PromiseLike<{ data: KnowledgeChunkMatch[] | null; error: unknown }>;
};

type RagLogger = {
  info(input: Record<string, unknown>): void;
  error(input: Record<string, unknown>): void;
};

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Unknown database error.";
}

export function chunkKnowledgeText(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < normalized.length && chunks.length < MAX_CHUNKS_PER_DOCUMENT) {
    const chunk = normalized.slice(cursor, cursor + CHUNK_SIZE).trim();
    if (chunk) chunks.push(chunk);

    if (cursor + CHUNK_SIZE >= normalized.length) break;
    cursor += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

export function buildRagQuery(input: {
  customerMessage: string;
  productName: string;
  productInfo: string;
}) {
  return [input.customerMessage, input.productName, input.productInfo]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(" ");
}

export function formatRagContext(matches: KnowledgeChunkMatch[]) {
  if (matches.length === 0) return "";

  return [
    "Retrieved knowledge from your saved knowledge base:",
    ...matches.map(
      (match, index) =>
        `[${index + 1}] ${match.title}\n${match.content.trim()}`,
    ),
  ].join("\n\n");
}

export function createRagService(
  createDatabase: () => RagDatabase,
  logger: RagLogger = defaultLogger,
) {
  async function saveKnowledgeDocument(
    userId: string,
    input: KnowledgeDocumentInput,
  ) {
    const title = input.title.trim();
    const content = input.content.slice(0, MAX_DOCUMENT_TEXT_LENGTH);
    const chunks = chunkKnowledgeText(content);

    if (!userId.trim()) {
      throw new Error("User ID is required.");
    }

    if (!title) {
      throw new Error("Knowledge document title is required.");
    }

    if (chunks.length === 0) {
      throw new Error("Knowledge document content is empty.");
    }

    const database = createDatabase();
    const { data: document, error: documentError } = await database
      .from("knowledge_documents")
      .insert({
        user_id: userId,
        title,
        source_key: input.sourceKey ?? null,
        source_url: input.sourceUrl ?? null,
        content_type: input.contentType ?? null,
      })
      .select("id")
      .single();

    if (documentError || !document) {
      throw new Error(
        `Could not save knowledge document: ${errorMessage(documentError)}`,
      );
    }

    const { error: chunkError } = await database
      .from("knowledge_chunks")
      .insert(
        chunks.map((chunk, index) => ({
          document_id: document.id,
          user_id: userId,
          chunk_index: index,
          content: chunk,
        })),
      );

    if (chunkError) {
      throw new Error(
        `Could not save knowledge chunks: ${errorMessage(chunkError)}`,
      );
    }

    logger.info({
      event: "rag_knowledge_saved",
      status: "success",
      message: "Knowledge document saved for RAG retrieval.",
      userId,
      chunkCount: chunks.length,
    });

    return {
      documentId: document.id,
      chunkCount: chunks.length,
    };
  }

  async function retrieveKnowledgeContext(
    userId: string,
    query: string,
    limit = DEFAULT_MATCH_LIMIT,
  ) {
    if (!userId.trim() || !query.trim()) {
      return { matches: [], context: "" };
    }

    const { data, error } = await createDatabase().rpc(
      "match_knowledge_chunks",
      {
        p_user_id: userId,
        p_query: query.slice(0, 2000),
        p_limit: limit,
      },
    );

    if (error) {
      logger.error({
        event: "rag_retrieval_failed",
        status: "error",
        message: "Could not retrieve RAG knowledge chunks.",
        userId,
        error,
      });
      return { matches: [], context: "" };
    }

    const matches = data ?? [];
    return {
      matches,
      context: formatRagContext(matches),
    };
  }

  return {
    saveKnowledgeDocument,
    retrieveKnowledgeContext,
  };
}

const ragService = createRagService(
  () => createAdminClient() as unknown as RagDatabase,
);

export const saveKnowledgeDocument = ragService.saveKnowledgeDocument;
export const retrieveKnowledgeContext = ragService.retrieveKnowledgeContext;
