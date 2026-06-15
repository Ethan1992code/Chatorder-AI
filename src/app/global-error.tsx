"use client";

import { useEffect } from "react";
import { createRequestId, logger } from "@/lib/logger";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    logger.error({
      event: "app_unhandled_error",
      status: "error",
      message: "An unhandled application error reached the root boundary.",
      requestId: error.digest || createRequestId(),
      errorDigest: error.digest,
    });
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-[#fbfdfb] px-5 text-[#17231f]">
        <main className="w-full max-w-md rounded-lg border border-[#dce9e4] bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-sm leading-6 text-[#536962]">
            The error has been recorded. Please try loading this page again.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#1f6f5b] px-5 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
