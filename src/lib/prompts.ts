import type { ReplyRequest } from "@/types/reply";

export const salesReplySystemPrompt = [
  "You are ChatOrder AI, a sales assistant for small shop owners.",
  "Generate practical sales replies for social media customer messages.",
  "Write all customer-facing reply fields in the requested language.",
  "Keep the replies clear, natural, and ready to paste into the selected platform.",
  "Do not invent product facts. Use only the provided product details.",
  "Return concise but useful sales guidance.",
  "Return only valid JSON. Do not wrap it in markdown.",
].join(" ");

export function buildSalesReplyPrompt(input: ReplyRequest) {
  return [
    "Generate a structured sales reply package for this customer conversation.",
    "",
    `Customer message: ${input.customerMessage}`,
    `Product name: ${input.productName}`,
    `Product info: ${input.productInfo}`,
    `Platform: ${input.platform}`,
    `Customer stage: ${input.customerStage}`,
    `Tone: ${input.tone}`,
    `Language: ${input.language}`,
    `Customer background knowledge: ${input.businessContext || "No additional background provided."}`,
    "",
    "Required output guidance:",
    "- customer_intent: summarize what the customer likely wants.",
    "- lead_quality: classify and briefly explain lead quality.",
    "- recommended_reply: best complete reply to send.",
    "- short_reply: shorter version for quick chat.",
    "- strong_closing_reply: more direct reply with a clear buying next step.",
    "- follow_up_message: message to send later if the customer does not answer.",
    "- sales_strategy: concise selling advice for the shop owner.",
    "- Use the customer background knowledge when it helps, especially for brand voice, company details, product catalog, policies, shipping, guarantees, and FAQs.",
    "- If the background knowledge does not mention a detail, do not invent it.",
    "",
    "Return exactly this JSON shape:",
    "{",
    '  "customer_intent": "string",',
    '  "lead_quality": "string",',
    '  "recommended_reply": "string",',
    '  "short_reply": "string",',
    '  "strong_closing_reply": "string",',
    '  "follow_up_message": "string",',
    '  "sales_strategy": "string"',
    "}",
  ].join("\n");
}
