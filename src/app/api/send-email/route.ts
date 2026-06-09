import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/service";
import { createClient } from "@/lib/supabase/server";
import type { EmailSendRequest } from "@/types/email";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in to send email." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Please send a valid email payload." },
      { status: 400 },
    );
  }

  const emailRequest: EmailSendRequest = {
    to: clean(body.to),
    subject: clean(body.subject),
    body: clean(body.body),
    replyTo: clean(body.replyTo),
  };

  const missingFields = (["to", "subject", "body"] as const).filter(
    (field) => !emailRequest[field],
  );

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: "Missing required fields.", missing_fields: missingFields },
      { status: 400 },
    );
  }

  if (!isValidEmail(emailRequest.to)) {
    return NextResponse.json(
      { error: "Recipient email is invalid." },
      { status: 400 },
    );
  }

  if (emailRequest.replyTo && !isValidEmail(emailRequest.replyTo)) {
    return NextResponse.json(
      { error: "Reply-to email is invalid." },
      { status: 400 },
    );
  }

  try {
    const result = await sendEmail(emailRequest);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email provider error.";

    return NextResponse.json(
      { error: `Could not send email: ${message}` },
      { status: 500 },
    );
  }
}
