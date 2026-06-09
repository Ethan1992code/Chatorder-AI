"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { UserNav } from "@/components/auth/UserNav";
import { FeedbackPanel } from "@/components/reply/FeedbackPanel";
import { KnowledgeBasePanel } from "@/components/reply/KnowledgeBasePanel";
import { ReplyForm } from "@/components/reply/ReplyForm";
import { ReplyResults } from "@/components/reply/ReplyResults";
import type { ReplyRequest, ReplyResult } from "@/types/reply";

const knowledgeStorageKey = "chatorder-ai-business-context";

const initialForm: ReplyRequest = {
  customerMessage: "",
  productName: "",
  productInfo: "",
  platform: "Instagram",
  customerStage: "New inquiry",
  tone: "Friendly",
  language: "English",
  businessContext: "",
};

function getInitialForm(): ReplyRequest {
  if (typeof window === "undefined") {
    return initialForm;
  }

  return {
    ...initialForm,
    businessContext:
      window.localStorage.getItem(knowledgeStorageKey) ??
      initialForm.businessContext,
  };
}

export default function AppPage() {
  const [form, setForm] = useState<ReplyRequest>(getInitialForm);
  const [result, setResult] = useState<ReplyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof ReplyRequest>(
    key: K,
    value: ReplyRequest[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateBusinessContext(value: string) {
    updateField("businessContext", value);
    window.localStorage.setItem(knowledgeStorageKey, value);
  }

  function fillExample(example: ReplyRequest) {
    setForm((current) => ({
      ...example,
      businessContext: current.businessContext,
    }));
    setResult(null);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;

        throw new Error(
          errorBody?.error ?? "Could not generate a reply. Please try again.",
        );
      }

      const data = (await response.json()) as ReplyResult;
      setResult(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfdfb] text-[#17231f]">
      <header className="border-b border-[#dce9e4] bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid size-9 place-items-center rounded-lg bg-[#1f6f5b] text-sm font-bold text-white">
              CO
            </span>
            <span>ChatOrder AI</span>
          </Link>
          <UserNav />
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:gap-6 sm:px-8 sm:py-8 lg:grid-cols-[420px_minmax(0,1fr)] lg:py-10">
        <div className="space-y-5 sm:space-y-6">
          <KnowledgeBasePanel
            value={form.businessContext ?? ""}
            onChange={updateBusinessContext}
          />
          <FeedbackPanel />
          <ReplyForm
            form={form}
            error={error}
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onFillExample={fillExample}
            onChange={updateField}
          />
        </div>
        <ReplyResults result={result} isLoading={isLoading} />
      </section>
    </main>
  );
}
