type LogStatus = "started" | "success" | "error";

type LogInput = {
  event: string;
  status: LogStatus;
  message: string;
  requestId?: string;
  userId?: string;
  error?: unknown;
  [key: string]: unknown;
};

const sensitiveKeys = new Set([
  "apikey",
  "authorization",
  "cookie",
  "email",
  "password",
  "prompt",
  "secret",
  "token",
]);

export function createRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isSensitiveKey(key: string) {
  const normalizedKey = key.replaceAll("_", "").toLowerCase();
  return [...sensitiveKeys].some((sensitiveKey) =>
    normalizedKey.includes(sensitiveKey),
  );
}

function sanitizeValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, seen));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue, seen)]),
  );
}

function buildEntry(input: LogInput) {
  const { error, ...fields } = input;
  const safeFields = Object.fromEntries(
    Object.entries(fields)
      .filter(([key]) => !isSensitiveKey(key))
      .map(([key, value]) => [key, sanitizeValue(value)]),
  );

  const entry: Record<string, unknown> = {
    ...safeFields,
    timestamp: new Date().toISOString(),
    requestId: input.requestId || createRequestId(),
  };

  if (error instanceof Error) {
    entry.errorName = error.name;
    entry.errorMessage = error.message;
  } else if (error !== undefined) {
    entry.errorMessage = "Unknown error";
  }

  return entry;
}

export const logger = {
  info(input: LogInput) {
    console.info(buildEntry(input));
  },
  error(input: LogInput) {
    console.error(buildEntry(input));
  },
};
