"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPortal } from "@/lib/creem/client-portal";

export function ManageSubscriptionButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePortal() {
    setError("");
    setIsLoading(true);
    const result = await requestPortal();

    if (result.status === "unauthorized") {
      router.push("/login?next=/billing");
      return;
    }

    if (result.status === "error") {
      setError(result.message);
      setIsLoading(false);
      return;
    }

    window.location.assign(result.portalUrl);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePortal}
        disabled={!enabled || isLoading}
        title={enabled ? undefined : "No Creem subscription is available to manage."}
        className="inline-flex h-12 items-center justify-center rounded-lg bg-[#17231f] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#274139] disabled:cursor-not-allowed disabled:bg-[#d8e2de] disabled:text-[#667a73]"
      >
        {isLoading ? "Opening portal..." : "Manage subscription"}
      </button>
      {error && (
        <p className="mt-3 text-sm leading-6 text-[#b4442d]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
