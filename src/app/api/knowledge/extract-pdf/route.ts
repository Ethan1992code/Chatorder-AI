import { PDFParse } from "pdf-parse";
import { NextResponse } from "next/server";
import { createRequestId, logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 60_000;

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
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required." }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { error: "PDF file must be between 1 byte and 10 MB." },
        { status: 400 },
      );
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const text = result.text.replace(/\s+/g, " ").trim();

      logger.info({
        event: "rag_pdf_extract_succeeded",
        status: "success",
        message: "PDF text extracted for RAG.",
        requestId,
        userId: user.id,
        metadata: {
          filename: file.name,
          size: file.size,
          extractedCharacters: text.length,
        },
      });

      return NextResponse.json({
        text: text.slice(0, MAX_EXTRACTED_TEXT_LENGTH),
        characters: text.length,
      });
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    logger.error({
      event: "rag_pdf_extract_failed",
      status: "error",
      message: "Could not extract PDF text for RAG.",
      requestId,
      userId: user.id,
      error,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not extract PDF text.",
      },
      { status: 400 },
    );
  }
}
