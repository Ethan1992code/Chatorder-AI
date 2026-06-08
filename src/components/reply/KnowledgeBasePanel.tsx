"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";

type KnowledgeBasePanelProps = {
  value: string;
  onChange: (value: string) => void;
};

const supportedExtensions = [".txt", ".md", ".csv", ".json"];

export function KnowledgeBasePanel({
  value,
  onChange,
}: KnowledgeBasePanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState("");

  const characterCount = value.length;
  const hasKnowledge = value.trim().length > 0;

  const summary = useMemo(() => {
    if (!hasKnowledge) {
      return "No background added yet";
    }

    return `${characterCount.toLocaleString()} characters saved locally`;
  }, [characterCount, hasKnowledge]);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!supportedExtensions.includes(extension)) {
      setStatus("Upload a text, markdown, CSV, or JSON file for now.");
      event.target.value = "";
      return;
    }

    const text = await file.text();
    const nextValue = [value.trim(), `Source: ${file.name}`, text.trim()]
      .filter(Boolean)
      .join("\n\n");

    onChange(nextValue);
    setStatus(`${file.name} added to knowledge base.`);
    event.target.value = "";
  }

  function clearKnowledge() {
    onChange("");
    setStatus("Knowledge base cleared.");
  }

  return (
    <section className="rounded-lg border border-[#dce9e4] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Customer Knowledge Base</h2>
          <p className="mt-2 text-sm leading-6 text-[#536962]">
            Add product catalogs, company background, shipping rules, FAQs, or
            brand voice notes so replies fit the customer better.
          </p>
        </div>
        <span className="rounded-lg bg-[#eaf7f0] px-3 py-2 text-sm font-semibold text-[#1f6f5b]">
          {summary}
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-dashed border-[#bfd6cd] bg-[#f7fbf8] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#1f6f5b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846]"
          >
            Upload background file
          </button>
          <p className="text-sm leading-6 text-[#536962]">
            Supports .txt, .md, .csv, and .json files.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <label
          htmlFor="businessContext"
          className="text-sm font-semibold text-[#17231f]"
        >
          Background Notes
        </label>
        <textarea
          id="businessContext"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste company profile, product catalog, return policy, shipping details, tone guidelines, FAQs..."
          className="min-h-36 w-full resize-y rounded-lg border border-[#c9d8d2] bg-white px-3.5 py-3 text-sm leading-6 outline-none transition placeholder:text-[#8a9c96] focus:border-[#1f6f5b] focus:ring-4 focus:ring-[#1f6f5b]/10"
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-5 text-sm text-[#536962]">{status}</p>
        <button
          type="button"
          disabled={!hasKnowledge}
          onClick={clearKnowledge}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[#c9d8d2] bg-white px-4 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear knowledge
        </button>
      </div>
    </section>
  );
}
