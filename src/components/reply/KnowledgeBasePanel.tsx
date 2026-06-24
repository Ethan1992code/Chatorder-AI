"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { saveKnowledgeDocumentFromClient } from "@/lib/knowledge/client";
import { uploadFileToR2 } from "@/lib/storage/r2-client";

type KnowledgeBasePanelProps = {
  value: string;
  onChange: (value: string) => void;
};

const textExtensions = [".txt", ".md", ".csv", ".json"];
const supportedExtensions = [
  ...textExtensions,
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
];

type UploadedAsset = {
  name: string;
  type: string;
  size: number;
  kind: "text" | "image" | "document";
  storageKey?: string;
  publicUrl?: string | null;
};

export function KnowledgeBasePanel({
  value,
  onChange,
}: KnowledgeBasePanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState("");
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const characterCount = value.length;
  const hasKnowledge = value.trim().length > 0;

  const summary = useMemo(() => {
    if (!hasKnowledge) {
      return "No background added yet";
    }

    return `${characterCount.toLocaleString()} characters saved locally`;
  }, [characterCount, hasKnowledge]);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const addedAssets: UploadedAsset[] = [];
    let failedUploads = 0;
    let savedRagChunks = 0;
    let skippedFiles = 0;

    setIsUploading(true);
    setStatus(
      `Uploading ${files.length} file${files.length === 1 ? "" : "s"}...`,
    );

    try {
      for (const file of files) {
        const extension = getExtension(file.name);
        const kind = getFileKind(file);

        if (!supportedExtensions.includes(extension)) {
          skippedFiles += 1;
          continue;
        }

        try {
          const uploadResult = await uploadFileToR2(file);

          addedAssets.push({
            name: file.name,
            type: file.type || extension,
            size: file.size,
            kind,
            storageKey: uploadResult.key,
            publicUrl: uploadResult.publicUrl,
          });

          if (kind === "text") {
            const text = await file.text();
            const savedDocument = await saveKnowledgeDocumentFromClient({
              title: file.name,
              content: text,
              sourceKey: uploadResult.key,
              sourceUrl: uploadResult.publicUrl,
              contentType: file.type || extension,
            });

            savedRagChunks += savedDocument.chunkCount ?? 0;
          }
        } catch {
          failedUploads += 1;
        }
      }
    } finally {
      setIsUploading(false);
    }

    if (addedAssets.length === 0) {
      setStatus("No supported files were added.");
      event.target.value = "";
      return;
    }
    
    setAssets((current) => [...addedAssets, ...current].slice(0, 12));
    setStatus(
      [
        `${addedAssets.length} file${addedAssets.length === 1 ? "" : "s"} stored in R2.`,
        savedRagChunks > 0
          ? `${savedRagChunks} RAG chunk${savedRagChunks === 1 ? "" : "s"} saved.`
          : "",
        skippedFiles > 0 ? `${skippedFiles} unsupported skipped.` : "",
        failedUploads > 0 ? `${failedUploads} failed.` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
    event.target.value = "";
  }

  function clearKnowledge() {
    onChange("");
    setAssets([]);
    setStatus("Knowledge base cleared.");
  }

  return (
    <section className="rounded-lg border border-[#dce9e4] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Customer Knowledge Base</h2>
          <p className="mt-2 text-sm leading-6 text-[#536962]">
            Add product photos, catalogs, company background, shipping rules,
            FAQs, or brand voice notes so replies fit the customer better.
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
            multiple
            accept=".txt,.md,.csv,.json,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,text/plain,text/markdown,text/csv,application/json,application/pdf,image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#1f6f5b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isUploading ? "Uploading..." : "Upload files"}
          </button>
          <p className="text-sm leading-6 text-[#536962]">
            Images, PDF, Word, Excel, PowerPoint, text, CSV, and JSON are
            accepted.
          </p>
        </div>
      </div>

      {assets.length > 0 && (
        <div className="mt-4 grid gap-2">
          {assets.map((asset, index) => (
            <div
              key={`${asset.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#dce9e4] bg-[#fbfdfb] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#17231f]">
                  {asset.name}
                </p>
                <p className="text-xs text-[#536962]">
                  {asset.kind} - {formatFileSize(asset.size)}
                </p>
                {asset.storageKey && (
                  <p className="truncate text-xs text-[#6d817a]">
                    {asset.publicUrl ? asset.publicUrl : asset.storageKey}
                  </p>
                )}
              </div>
              <span className="rounded-lg bg-[#eaf7f0] px-2.5 py-1 text-xs font-semibold text-[#1f6f5b]">
                Stored in R2
              </span>
            </div>
          ))}
        </div>
      )}

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
          placeholder="Paste company profile, product catalog, return policy, shipping details, tone guidelines, FAQs, or visual notes from uploaded images..."
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

function getExtension(filename: string) {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

function getFileKind(file: File): UploadedAsset["kind"] {
  const extension = getExtension(file.name);

  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (textExtensions.includes(extension)) {
    return "text";
  }

  return "document";
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
