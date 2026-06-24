import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { NextResponse } from "next/server";
import { createRequestId, logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 60_000;

function isAllowedR2SourceUrl(sourceUrl: string) {
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();

  if (!publicBaseUrl) {
    return false;
  }

  return sourceUrl.startsWith(publicBaseUrl.replace(/\/+$/, "") + "/");
}

async function getPdfBufferFromRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { sourceUrl?: unknown };
    const sourceUrl =
      typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";

    if (!sourceUrl || !isAllowedR2SourceUrl(sourceUrl)) {
      throw new Error("PDF source URL is not allowed.");
    }

    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error("Could not download PDF from R2.");
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_PDF_SIZE_BYTES) {
      throw new Error("PDF file must be 10 MB or smaller.");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length <= 0 || buffer.length > MAX_PDF_SIZE_BYTES) {
      throw new Error("PDF file must be between 1 byte and 10 MB.");
    }

    return {
      buffer,
      filename: new URL(sourceUrl).pathname.split("/").pop() ?? "r2-file.pdf",
      size: buffer.length,
    };
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new Error("PDF file is required.");
  }

  if (file.size <= 0 || file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error("PDF file must be between 1 byte and 10 MB.");
  }

  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Only PDF files are supported.");
  }

  return {
    buffer: Buffer.from(await file.arrayBuffer()),
    filename: file.name,
    size: file.size,
  };
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
    const { buffer, filename, size } = await getPdfBufferFromRequest(request);
    const result = await pdfParse(buffer);
      const text = result.text.replace(/\s+/g, " ").trim();

      logger.info({
        event: "rag_pdf_extract_succeeded",
        status: "success",
        message: "PDF text extracted for RAG.",
        requestId,
        userId: user.id,
        metadata: {
          filename,
          size,
          extractedCharacters: text.length,
        },
      });

      return NextResponse.json({
        text: text.slice(0, MAX_EXTRACTED_TEXT_LENGTH),
        characters: text.length,
      });
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
