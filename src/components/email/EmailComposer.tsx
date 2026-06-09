"use client";

import { FormEvent, useState } from "react";
import type { EmailSendRequest } from "@/types/email";

const initialForm: EmailSendRequest = {
  to: "",
  subject: "",
  body: "",
  replyTo: "",
};

export function EmailComposer() {
  const [form, setForm] = useState<EmailSendRequest>(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSending, setIsSending] = useState(false);

  function updateField<K extends keyof EmailSendRequest>(
    key: K,
    value: EmailSendRequest[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function fillExample() {
    setForm({
      to: "",
      subject: "Your order question from ChatOrder AI",
      body: [
        "Hi, thank you for your message.",
        "",
        "The item is available today. I can reserve it for you and send the checkout details if you would like to continue.",
        "",
        "Best,",
        "ChatOrder AI Demo Shop",
      ].join("\n"),
      replyTo: "",
    });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Could not send email.");
      }

      setSuccess(`Email sent${data?.id ? `: ${data.id}` : "."}`);
      setForm(initialForm);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="rounded-lg border border-[#dce9e4] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Send customer email</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#536962]">
            Send order updates, follow-ups, or AI-assisted sales replies from
            your protected workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={fillExample}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-[#c9d8d2] bg-white px-4 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
        >
          Fill example
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-lg border border-[#f1c8bd] bg-[#fff6f3] px-4 py-3 text-sm leading-6 text-[#b4442d]">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-5 rounded-lg border border-[#bfe1d4] bg-[#f2faf6] px-4 py-3 text-sm leading-6 text-[#1f6f5b]">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="to" className="text-sm font-semibold">
              Customer Email
            </label>
            <input
              id="to"
              type="email"
              required
              value={form.to}
              onChange={(event) => updateField("to", event.target.value)}
              placeholder="customer@example.com"
              className="h-12 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="replyTo" className="text-sm font-semibold">
              Reply-to Email
            </label>
            <input
              id="replyTo"
              type="email"
              value={form.replyTo}
              onChange={(event) => updateField("replyTo", event.target.value)}
              placeholder="Optional"
              className="h-12 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="subject" className="text-sm font-semibold">
            Subject
          </label>
          <input
            id="subject"
            required
            value={form.subject}
            onChange={(event) => updateField("subject", event.target.value)}
            placeholder="Your order update"
            className="h-12 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="body" className="text-sm font-semibold">
            Message
          </label>
          <textarea
            id="body"
            required
            value={form.body}
            onChange={(event) => updateField("body", event.target.value)}
            placeholder="Write the email your customer should receive..."
            className="min-h-64 w-full resize-y rounded-lg border border-[#c9d8d2] bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
          />
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-[#1f6f5b] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846] disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit"
        >
          {isSending ? "Sending..." : "Send email"}
        </button>
      </form>
    </section>
  );
}
