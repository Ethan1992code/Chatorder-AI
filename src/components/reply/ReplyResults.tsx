"use client";

import { useState } from "react";
import type { ReplyResult } from "@/types/reply";

type ReplyTextField = Exclude<keyof ReplyResult, "knowledge_sources">;

const resultFields: Array<{
  key: ReplyTextField;
  title: string;
  copyable?: boolean;
  accent?: "green" | "coral";
}> = [
  { key: "customer_intent", title: "Customer Intent", accent: "green" },
  { key: "lead_quality", title: "Lead Quality", accent: "coral" },
  { key: "recommended_reply", title: "Recommended Reply", copyable: true },
  { key: "short_reply", title: "Short Reply", copyable: true },
  {
    key: "strong_closing_reply",
    title: "Strong Closing Reply",
    copyable: true,
  },
  { key: "follow_up_message", title: "Follow-up Message", copyable: true },
  { key: "sales_strategy", title: "Sales Strategy" },
];

type ReplyResultsProps = {
  result: ReplyResult | null;
  isLoading: boolean;
};

export function ReplyResults({ result, isLoading }: ReplyResultsProps) {
  return (
    <section className="rounded-lg border border-[#dce9e4] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 border-b border-[#e1ece7] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">AI Generated Results</h2>
          <p className="mt-2 text-sm leading-6 text-[#536962]">
            Review, adjust, and copy the best reply for your customer.
          </p>
        </div>
        <p className="text-sm font-medium text-[#d7654d]">
          {result ? "Ready to send" : "Waiting for details"}
        </p>
      </div>

      {isLoading && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-lg bg-[#f2faf6]"
            />
          ))}
        </div>
      )}

      {!isLoading && !result && (
        <div className="mt-6 rounded-lg border border-dashed border-[#bfd6cd] bg-[#f2faf6] p-6 text-center sm:p-8">
          <div className="mx-auto grid size-12 place-items-center rounded-lg bg-white text-lg font-bold text-[#1f6f5b]">
            CO
          </div>
          <h3 className="mx-auto mt-4 max-w-sm text-lg font-semibold">
            Pick an example or enter a customer message to start.
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#536962]">
            The generated intent, lead quality, reply options, follow-up, and
            sales strategy will appear here.
          </p>
        </div>
      )}

      {!isLoading && result && (
        <div className="mt-6 grid gap-4">
          {resultFields.map((field) => (
            <article
              key={field.key}
              className="rounded-lg border border-[#dce9e4] bg-[#ffffff] p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <div
                  className={`grid size-11 shrink-0 place-items-center rounded-lg text-sm font-bold ${
                    field.accent === "coral"
                      ? "bg-[#fff2ed] text-[#d7654d]"
                      : "bg-[#eaf7f0] text-[#1f6f5b]"
                  }`}
                >
                  {field.title.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-lg font-semibold">{field.title}</h3>
                    {field.copyable && <CopyButton value={result[field.key]} />}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#536962]">
                    {result[field.key]}
                  </p>
                </div>
              </div>
            </article>
          ))}

          {result.knowledge_sources && result.knowledge_sources.length > 0 && (
            <article className="rounded-lg border border-[#dce9e4] bg-[#f8fcfa] p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Knowledge used</h3>
              <p className="mt-2 text-sm leading-6 text-[#536962]">
                These are the saved knowledge snippets retrieved for this
                reply. If the exact battery life is not shown here, the AI did
                not receive that detail.
              </p>
              <div className="mt-4 grid gap-3">
                {result.knowledge_sources.map((source, index) => (
                  <div
                    key={`${source.title}-${index}`}
                    className="rounded-lg border border-[#dce9e4] bg-white p-4"
                  >
                    <p className="text-sm font-semibold text-[#17231f]">
                      {source.title}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#536962]">
                      {source.snippet}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 1800);
    }
  }

  return (
    <button
      type="button"
      onClick={copyText}
      className={`inline-flex h-9 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
        copied
          ? "border-[#1f6f5b] bg-[#eaf7f0] text-[#175846]"
          : copyError
            ? "border-[#ffd6cc] bg-[#fff2ed] text-[#b84e37]"
            : "border-[#c9d8d2] bg-white text-[#1f6f5b] hover:border-[#93b6a8] hover:bg-[#f2faf6]"
      }`}
    >
      {copied ? "Copied!" : copyError ? "Try again" : "Copy"}
    </button>
  );
}
