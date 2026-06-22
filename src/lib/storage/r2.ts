import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEFAULT_UPLOAD_EXPIRES_SECONDS = 300;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export type CreateR2UploadInput = {
  userId: string;
  filename: string;
  contentType: string;
  size: number;
};

export type R2UploadTarget = {
  key: string;
  uploadUrl: string;
  publicUrl: string | null;
  maxSizeBytes: number;
  expiresIn: number;
};

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string | null;
};

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim() || null;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "Cloudflare R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.",
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl,
  };
}

export function createR2Client(config = getR2Config()) {
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export async function createR2PresignedUploadUrl(
  input: CreateR2UploadInput,
): Promise<R2UploadTarget> {
  validateUploadInput(input);

  const config = getR2Config();
  const key = createR2ObjectKey(input.userId, input.filename);
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
  });

  const uploadUrl = await getSignedUrl(createR2Client(config), command, {
    expiresIn: DEFAULT_UPLOAD_EXPIRES_SECONDS,
  });

  return {
    key,
    uploadUrl,
    publicUrl: getR2PublicUrl(key, config.publicBaseUrl),
    maxSizeBytes: MAX_UPLOAD_SIZE_BYTES,
    expiresIn: DEFAULT_UPLOAD_EXPIRES_SECONDS,
  };
}

export function createR2ObjectKey(userId: string, filename: string) {
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeFilename = filename
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  const finalFilename = safeFilename || "upload";
  const now = new Date();
  const month = now.toISOString().slice(0, 7);

  return `users/${safeUserId}/uploads/${month}/${crypto.randomUUID()}-${finalFilename}`;
}

export function getR2PublicUrl(key: string, publicBaseUrl: string | null) {
  if (!publicBaseUrl) {
    return null;
  }

  return `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
}

export function validateUploadInput(input: CreateR2UploadInput) {
  if (!input.userId) {
    throw new Error("User ID is required.");
  }

  if (!input.filename?.trim()) {
    throw new Error("Filename is required.");
  }

  if (!input.contentType?.trim()) {
    throw new Error("Content type is required.");
  }

  if (!Number.isInteger(input.size) || input.size <= 0) {
    throw new Error("File size must be a positive integer.");
  }

  if (input.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File is too large. Maximum upload size is 10 MB.");
  }
}
