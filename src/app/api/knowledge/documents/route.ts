import { NextResponse } from "next/server";
import { createRequestId, logger } from "@/lib/logger";
import { saveKnowledgeDocument } from "@/lib/services/rag";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type KnowledgeDocumentRequest = {
  title?: unknown;
  content?: unknown;
  sourceKey?: unknown;
  sourceUrl?: unknown;
  contentType?: unknown;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("id, title, source_key, source_url, content_type, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    logger.error({
      event: "rag_knowledge_list_api_failed",
      status: "error",
      message: "Could not list knowledge documents from the API.",
      userId: user.id,
      error,
    });

    return NextResponse.json(
      { error: "Could not load knowledge documents." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    documents: (data ?? []).map((document) => ({
      id: document.id,
      title: document.title,
      sourceKey: document.source_key,
      sourceUrl: document.source_url,
      contentType: document.content_type,
      createdAt: document.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as KnowledgeDocumentRequest;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content =
      typeof body.content === "string" ? body.content.trim() : "";

    const result = await saveKnowledgeDocument(user.id, {
      title,
      content,
      sourceKey:
        typeof body.sourceKey === "string" ? body.sourceKey.trim() : null,
      sourceUrl:
        typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : null,
      contentType:
        typeof body.contentType === "string" ? body.contentType.trim() : null,
    });

    logger.info({
      event: "rag_knowledge_save_api_succeeded",
      status: "success",
      message: "Knowledge document saved from the API.",
      requestId,
      userId: user.id,
      chunkCount: result.chunkCount,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({
      event: "rag_knowledge_save_api_failed",
      status: "error",
      message: "Could not save knowledge document from the API.",
      requestId,
      userId: user.id,
      error,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save knowledge document.",
      },
      { status: 400 },
    );
  }
}
