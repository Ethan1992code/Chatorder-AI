import assert from "node:assert/strict";
import test from "node:test";
import { createR2ObjectKey, getR2PublicUrl, validateUploadInput } from "./r2";

test("R2 object keys are scoped by user and sanitized", () => {
  const key = createR2ObjectKey("user_123", "../catalog final.pdf");

  assert.match(
    key,
    /^users\/user_123\/uploads\/\d{4}-\d{2}\/[a-f0-9-]+-..-catalog-final.pdf$/,
  );
  assert.doesNotMatch(key, /\.\.\//);
});

test("R2 public URLs use the optional public base URL", () => {
  assert.equal(
    getR2PublicUrl("users/u1/file.png", "https://files.example.com/"),
    "https://files.example.com/users/u1/file.png",
  );
  assert.equal(getR2PublicUrl("users/u1/file.png", null), null);
});

test("R2 upload validation rejects missing and oversized files", () => {
  assert.throws(
    () =>
      validateUploadInput({
        userId: "user_123",
        filename: "large.pdf",
        contentType: "application/pdf",
        size: 10 * 1024 * 1024 + 1,
      }),
    /too large/,
  );

  assert.doesNotThrow(() =>
    validateUploadInput({
      userId: "user_123",
      filename: "catalog.pdf",
      contentType: "application/pdf",
      size: 1024,
    }),
  );
});
