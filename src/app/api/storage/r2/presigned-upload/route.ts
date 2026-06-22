import { NextResponse } from "next/server";
import { createRequestId, logger } from "@/lib/logger";
import { createR2PresignedUploadUrl } from "@/lib/storage/r2";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PresignedUploadRequest = {
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
};

export async function POST(request: Request) {
  const requestId = createRequestId();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    logger.error({
      event: "r2_presigned_upload_denied",
      status: "error",
      message: "User must be logged in to create an R2 upload URL.",
      requestId,
    });

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PresignedUploadRequest;
    const filename =
      typeof body.filename === "string" ? body.filename.trim() : "";
    const contentType =
      typeof body.contentType === "string" ? body.contentType.trim() : "";
    const size = typeof body.size === "number" ? body.size : 0;

    logger.info({
      event: "r2_presigned_upload_started",
      userId: user.id,
      status: "started",
      message: "Creating R2 presigned upload URL.",
      requestId,
      metadata: {
        filename,
        contentType,
        size,
      },
    });

    const uploadTarget = await createR2PresignedUploadUrl({
      userId: user.id,
      filename,
      contentType,
      size,
    });

    logger.info({
      event: "r2_presigned_upload_created",
      userId: user.id,
      status: "success",
      message: "R2 presigned upload URL created.",
      requestId,
      metadata: {
        key: uploadTarget.key,
        contentType,
        size,
      },
    });

    return NextResponse.json(uploadTarget);
  } catch (error) {
    logger.error({
      event: "r2_presigned_upload_failed",
      userId: user.id,
      status: "error",
      message: "Failed to create R2 presigned upload URL.",
      requestId,
      error,
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create upload URL.",
      },
      { status: 400 },
    );
  }
}
