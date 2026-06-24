type SaveKnowledgeDocumentInput = {
  title: string;
  content: string;
  sourceKey?: string | null;
  sourceUrl?: string | null;
  contentType?: string | null;
};

export async function saveKnowledgeDocumentFromClient(
  input: SaveKnowledgeDocumentInput,
) {
  const response = await fetch("/api/knowledge/documents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const body = (await response.json()) as {
    documentId?: string;
    chunkCount?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? "Could not save knowledge document.");
  }

  return body;
}

export async function extractPdfTextFromClient(file: File, sourceUrl?: string | null) {
  const requestBody = sourceUrl
    ? JSON.stringify({ sourceUrl })
    : (() => {
        const formData = new FormData();
        formData.append("file", file);
        return formData;
      })();

  const response = await fetch("/api/knowledge/extract-pdf", {
    method: "POST",
    headers: sourceUrl ? { "Content-Type": "application/json" } : undefined,
    body: requestBody,
  });

  const responseBody = (await response.json()) as {
    text?: string;
    characters?: number;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(responseBody.error ?? "Could not extract PDF text.");
  }

  return {
    text: responseBody.text ?? "",
    characters: responseBody.characters ?? 0,
  };
}
