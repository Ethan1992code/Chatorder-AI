import { NextResponse } from "next/server";
import { createRequestId, logger } from "@/lib/logger";
import { buildSalesReplyPrompt, salesReplySystemPrompt } from "@/lib/prompts";
import {
  confirmGenerateReply,
  releaseGenerateReply,
  reserveGenerateReply,
} from "@/lib/services/ai-usage";
import { buildRagQuery, retrieveKnowledgeContext } from "@/lib/services/rag";
import { createClient } from "@/lib/supabase/server";
import {
  customerStages,
  platforms,
  replyLanguages,
  ReplyRequest,
  ReplyResult,
  tones,
} from "@/types/reply";

const requiredFields = [
  "customerMessage",
  "productName",
  "productInfo",
  "platform",
  "customerStage",
  "tone",
  "language",
] as const satisfies ReadonlyArray<keyof ReplyRequest>;

const salesReplyJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    customer_intent: { type: "string" },
    lead_quality: { type: "string" },
    recommended_reply: { type: "string" },
    short_reply: { type: "string" },
    strong_closing_reply: { type: "string" },
    follow_up_message: { type: "string" },
    sales_strategy: { type: "string" },
  },
  required: [
    "customer_intent",
    "lead_quality",
    "recommended_reply",
    "short_reply",
    "strong_closing_reply",
    "follow_up_message",
    "sales_strategy",
  ],
};

const defaultBaseUrl = "https://api.deepseek.com";
const defaultModel = "deepseek-v4-flash";
const maxBusinessContextLength = 12000;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getMissingFields(body: Record<string, unknown>) {
  return requiredFields.filter((field) => !clean(body[field]));
}

function isOneOf<T extends readonly string[]>(
  value: string,
  options: T,
): value is T[number] {
  return (options as readonly string[]).includes(value);
}

function isSalesReplyResponse(value: unknown): value is ReplyResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  return salesReplyJsonSchema.required.every(
    (key) => typeof (value as Record<string, unknown>)[key] === "string",
  );
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function extractChatCompletionText(responseBody: unknown) {
  const choices = (responseBody as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return "";
  }

  const firstChoice = choices[0] as {
    message?: { content?: unknown };
  };

  return typeof firstChoice.message?.content === "string"
    ? firstChoice.message.content
    : "";
}

function buildReplyRequest(body: Record<string, unknown>): ReplyRequest | null {
  const platform = clean(body.platform);
  const customerStage = clean(body.customerStage);
  const tone = clean(body.tone);
  const language = clean(body.language);

  if (
    !isOneOf(platform, platforms) ||
    !isOneOf(customerStage, customerStages) ||
    !isOneOf(tone, tones) ||
    !isOneOf(language, replyLanguages)
  ) {
    return null;
  }

  return {
    customerMessage: clean(body.customerMessage),
    productName: clean(body.productName),
    productInfo: clean(body.productInfo),
    platform,
    customerStage,
    tone,
    language,
    businessContext: clean(body.businessContext).slice(
      0,
      maxBusinessContextLength,
    ),
  };
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  requestId: string,
) {
  return NextResponse.json(body, {
    status,
    headers: { "x-request-id": requestId },
  });
}

export async function POST(request: Request) {
  const incomingRequestId = request.headers.get("x-request-id")?.trim();
  const requestId =
    incomingRequestId && /^[a-zA-Z0-9._:-]{1,128}$/.test(incomingRequestId)
      ? incomingRequestId
      : createRequestId();
  const startedAt = Date.now();
  let userId: string | undefined;
  let usageMonth: string | undefined;

  async function releaseUsageReservation() {
    if (!userId || !usageMonth) return;

    const reservedMonth = usageMonth;
    usageMonth = undefined;

    try {
      await releaseGenerateReply(userId, reservedMonth);
    } catch (error) {
      logger.error({
        event: "ai_reply_usage_release_failed",
        status: "error",
        message: "Could not release the AI reply usage reservation.",
        requestId,
        userId,
        usageMonth: reservedMonth,
        error,
      });
    }
  }

  logger.info({
    event: "ai_reply_generate_started",
    status: "started",
    message: "AI reply generation started.",
    requestId,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      logger.error({
        event: "ai_reply_generate_failed",
        status: "error",
        message: "Could not verify the user session.",
        requestId,
        failureType: "auth_lookup_failed",
        providerCode: authError.code,
      });
      return jsonResponse(
        { error: "Could not verify your session. Please log in again." },
        401,
        requestId,
      );
    }

    userId = user?.id;

    if (!user) {
      logger.error({
        event: "ai_reply_generate_failed",
        status: "error",
        message: "AI reply generation requires authentication.",
        requestId,
        failureType: "unauthorized",
      });
      return jsonResponse(
        { error: "Please log in to generate a sales reply." },
        401,
        requestId,
      );
    }

    let body: Record<string, unknown>;

    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      logger.error({
        event: "ai_reply_generate_failed",
        status: "error",
        message: "AI reply request contained invalid JSON.",
        requestId,
        userId,
        failureType: "invalid_json",
      });
      return jsonResponse(
        { error: "Invalid JSON body. Please send a valid POST JSON payload." },
        400,
        requestId,
      );
    }

    const missingFields = getMissingFields(body);
    if (missingFields.length > 0) {
      logger.error({
        event: "ai_reply_generate_failed",
        status: "error",
        message: "AI reply request failed validation.",
        requestId,
        userId,
        failureType: "missing_fields",
        missingFieldNames: missingFields,
      });
      return jsonResponse(
        {
          error: "Missing required fields.",
          missing_fields: missingFields,
        },
        400,
        requestId,
      );
    }

    const apiKey =
      process.env.LLM_API_KEY ??
      process.env.DEEPSEEK_API_KEY ??
      process.env.OPENAI_API_KEY;
    if (!apiKey) {
      logger.error({
        event: "ai_reply_generate_failed",
        status: "error",
        message: "AI provider is not configured.",
        requestId,
        userId,
        failureType: "provider_not_configured",
      });
      return jsonResponse(
        {
          error:
            "AI API key is not configured. Set LLM_API_KEY or DEEPSEEK_API_KEY on the server.",
        },
        500,
        requestId,
      );
    }

    const baseUrl = normalizeBaseUrl(process.env.LLM_BASE_URL ?? defaultBaseUrl);
    const model = process.env.LLM_MODEL ?? defaultModel;

    const input = buildReplyRequest(body);
    if (!input) {
      logger.error({
        event: "ai_reply_generate_failed",
        status: "error",
        message: "AI reply request contained an unsupported option.",
        requestId,
        userId,
        failureType: "unsupported_option",
      });
      return jsonResponse(
        { error: "One or more select fields contain an unsupported value." },
        400,
        requestId,
      );
    }

    const ragQuery = buildRagQuery({
      customerMessage: input.customerMessage,
      productName: input.productName,
      productInfo: input.productInfo,
    });
    const ragResult = await retrieveKnowledgeContext(user.id, ragQuery);
    const inputWithRag = {
      ...input,
      businessContext: [input.businessContext, ragResult.context]
        .filter(Boolean)
        .join("\n\n"),
    };

    logger.info({
      event: "rag_knowledge_retrieved",
      status: "success",
      message: "Retrieved saved knowledge chunks for reply generation.",
      requestId,
      userId,
      ragChunkCount: ragResult.matches.length,
    });

    const reservation = await reserveGenerateReply(user.id, requestId);
    if (!reservation.allowed) {
      return jsonResponse(
        {
          error: "Monthly generate reply limit reached.",
          code: "MONTHLY_LIMIT_REACHED",
        },
        403,
        requestId,
      );
    }
    usageMonth = reservation.usageMonth;

    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: salesReplySystemPrompt,
          },
          {
            role: "user",
            content: buildSalesReplyPrompt(inputWithRag),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    });

    const aiBody = await aiResponse.json();

    if (!aiResponse.ok) {
      const message =
        typeof aiBody?.error?.message === "string"
          ? aiBody.error.message
          : "AI provider request failed.";

      logger.error({
        event: "ai_reply_generate_failed",
        status: "error",
        message: "AI provider rejected the reply request.",
        requestId,
        userId,
        failureType: "provider_rejected",
        providerStatus: aiResponse.status,
        model,
        durationMs: Date.now() - startedAt,
      });
      await releaseUsageReservation();
      return jsonResponse(
        { error: `AI provider failed to generate a reply: ${message}` },
        500,
        requestId,
      );
    }

    const outputText = extractChatCompletionText(aiBody);
    if (!outputText) {
      logger.error({
        event: "ai_reply_generate_failed",
        status: "error",
        message: "AI provider returned an empty response.",
        requestId,
        userId,
        failureType: "empty_provider_response",
        model,
        durationMs: Date.now() - startedAt,
      });
      await releaseUsageReservation();
      return jsonResponse(
        {
          error:
            "AI provider returned an empty response. Please try again with more customer or product detail.",
        },
        500,
        requestId,
      );
    }

    const parsed = JSON.parse(outputText) as unknown;
    if (!isSalesReplyResponse(parsed)) {
      logger.error({
        event: "ai_reply_generate_failed",
        status: "error",
        message: "AI provider returned an unexpected response shape.",
        requestId,
        userId,
        failureType: "invalid_provider_response",
        model,
        durationMs: Date.now() - startedAt,
      });
      await releaseUsageReservation();
      return jsonResponse(
        {
          error:
            "AI provider returned an unexpected response shape. Please try again.",
        },
        500,
        requestId,
      );
    }

    await confirmGenerateReply(user.id, reservation.usageMonth);
    usageMonth = undefined;

    logger.info({
      event: "ai_reply_generate_succeeded",
      status: "success",
      message: "AI reply generation succeeded.",
      requestId,
      userId,
      model,
      durationMs: Date.now() - startedAt,
    });
    return jsonResponse(parsed, 200, requestId);
  } catch (error) {
    await releaseUsageReservation();
    const message =
      error instanceof Error ? error.message : "Unknown AI provider error.";

    logger.error({
      event: "ai_reply_generate_failed",
      status: "error",
      message: "AI reply generation failed unexpectedly.",
      requestId,
      userId,
      failureType: "unexpected_error",
      durationMs: Date.now() - startedAt,
      error,
    });
    return jsonResponse(
      { error: `AI provider failed to generate a reply: ${message}` },
      500,
      requestId,
    );
  }
}
