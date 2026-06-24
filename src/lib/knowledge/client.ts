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
