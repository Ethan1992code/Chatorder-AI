import type { EmailSendRequest, EmailSendResult } from "@/types/email";

const resendApiUrl = "https://api.resend.com/emails";

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error(
      "Email service is not configured. Set RESEND_API_KEY and EMAIL_FROM on the server.",
    );
  }

  return { apiKey, from };
}

function toTextHtml(body: string) {
  return body
    .split("\n")
    .map((line) => line.trim())
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br />"))
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendEmail(
  input: EmailSendRequest,
): Promise<EmailSendResult> {
  const { apiKey, from } = getEmailConfig();

  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.body,
      html: toTextHtml(input.body),
      reply_to: input.replyTo || undefined,
    }),
  });

  const responseBody = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
    error?: string;
  } | null;

  if (!response.ok) {
    throw new Error(
      responseBody?.message ??
        responseBody?.error ??
        "Email provider failed to send the message.",
    );
  }

  return { id: responseBody?.id ?? "sent" };
}
