"use client";

import { FormEvent, useState } from "react";

const feedbackEmail = "hello@chatorder.ai";

export function FeedbackPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState("Bug report");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const subject = encodeURIComponent(`ChatOrder AI feedback: ${feedbackType}`);
    const body = encodeURIComponent(
      [
        `Feedback type: ${feedbackType}`,
        "",
        "Message:",
        message,
        "",
        contact ? `Contact: ${contact}` : "Contact: Not provided",
        `Page: ${window.location.href}`,
      ].join("\n"),
    );

    window.location.href = `mailto:${feedbackEmail}?subject=${subject}&body=${body}`;
  }

  return (
    <section className="rounded-lg border border-[#dce9e4] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Feedback</h2>
          <p className="mt-2 text-sm leading-6 text-[#536962]">
            Report a problem, request a feature, or share what would make this
            tool better.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[#c9d8d2] bg-white px-4 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
        >
          {isOpen ? "Close" : "Send feedback"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="feedbackType"
              className="text-sm font-semibold text-[#17231f]"
            >
              Feedback Type
            </label>
            <select
              id="feedbackType"
              value={feedbackType}
              onChange={(event) => setFeedbackType(event.target.value)}
              className="h-11 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
            >
              <option>Bug report</option>
              <option>Feature request</option>
              <option>AI reply quality</option>
              <option>Upload issue</option>
              <option>Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="feedbackMessage"
              className="text-sm font-semibold text-[#17231f]"
            >
              Message
            </label>
            <textarea
              id="feedbackMessage"
              required
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us what happened or what you want to improve..."
              className="min-h-28 w-full resize-y rounded-lg border border-[#c9d8d2] bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="feedbackContact"
              className="text-sm font-semibold text-[#17231f]"
            >
              Contact Email
            </label>
            <input
              id="feedbackContact"
              type="email"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Optional"
              className="h-11 w-full rounded-lg border border-[#c9d8d2] bg-white px-3.5 text-sm outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#1f6f5b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846]"
          >
            Send by email
          </button>
        </form>
      )}
    </section>
  );
}
