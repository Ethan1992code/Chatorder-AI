import { NextResponse } from "next/server";
import { buildSalesReplyPrompt, salesReplySystemPrompt } from "@/lib/prompts";
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
  };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Please send a valid POST JSON payload." },
      { status: 400 },
    );
  }

  const missingFields = getMissingFields(body);
  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required fields.",
        missing_fields: missingFields,
      },
      { status: 400 },
    );
  }

  const apiKey =
    process.env.LLM_API_KEY ??
    process.env.DEEPSEEK_API_KEY ??
    process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI API key is not configured. Set LLM_API_KEY or DEEPSEEK_API_KEY on the server.",
      },
      { status: 500 },
    );
  }

  const baseUrl = normalizeBaseUrl(process.env.LLM_BASE_URL ?? defaultBaseUrl);
  const model = process.env.LLM_MODEL ?? defaultModel;

  const input = buildReplyRequest(body);
  if (!input) {
    return NextResponse.json(
      { error: "One or more select fields contain an unsupported value." },
      { status: 400 },
    );
  }

  try {
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
            content: buildSalesReplyPrompt(input),
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

      return NextResponse.json(
        { error: `AI provider failed to generate a reply: ${message}` },
        { status: 500 },
      );
    }

    const outputText = extractChatCompletionText(aiBody);
    if (!outputText) {
      return NextResponse.json(
        {
          error:
            "AI provider returned an empty response. Please try again with more customer or product detail.",
        },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(outputText) as unknown;
    if (!isSalesReplyResponse(parsed)) {
      return NextResponse.json(
        {
          error:
            "AI provider returned an unexpected response shape. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI provider error.";

    return NextResponse.json(
      { error: `AI provider failed to generate a reply: ${message}` },
      { status: 500 },
    );
  }
}
