export type R2ClientUploadResult = {
  key: string;
  publicUrl: string | null;
};

type PresignedUploadResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string | null;
  maxSizeBytes: number;
  expiresIn: number;
};

export async function uploadFileToR2(file: File): Promise<R2ClientUploadResult> {
  const presignedResponse = await fetch("/api/storage/r2/presigned-upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
  });

  const uploadTarget = (await presignedResponse.json()) as
    | PresignedUploadResponse
    | { error?: string };

  if (!presignedResponse.ok) {
    throw new Error(
      "error" in uploadTarget && uploadTarget.error
        ? uploadTarget.error
        : "Could not create upload URL.",
    );
  }

  if (!("uploadUrl" in uploadTarget)) {
    throw new Error("Upload URL response is invalid.");
  }

  const uploadResponse = await fetch(uploadTarget.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("File upload failed.");
  }

  return {
    key: uploadTarget.key,
    publicUrl: uploadTarget.publicUrl,
  };
}
