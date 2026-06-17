"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  requestCheckout,
  type CheckoutPlanKey,
} from "@/lib/creem/client-checkout";

type PricingActionsProps = {
  planKey: "free" | CheckoutPlanKey | "business";
  cta: string;
  isAuthenticated: boolean;
};

const contactHref =
  "mailto:hello@chatorder.ai?subject=ChatOrder%20AI%20Business%20plan";

export function PricingActions({
  planKey,
  cta,
  isAuthenticated,
}: PricingActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (planKey === "free") {
    return (
      <Link href="/signup" className={secondaryButtonClassName}>
        {cta}
      </Link>
    );
  }

  if (planKey === "business") {
    return (
      <a href={contactHref} className={secondaryButtonClassName}>
        {cta}
      </a>
    );
  }

  const checkoutPlanKey: CheckoutPlanKey = planKey;

  async function handleCheckout() {
    setError("");

    if (!isAuthenticated) {
      router.push("/login?next=/pricing");
      return;
    }

    setIsLoading(true);
    const result = await requestCheckout(checkoutPlanKey);

    if (result.status === "unauthorized") {
      router.push("/login?next=/pricing");
      return;
    }

    if (result.status === "error") {
      setError(result.message);
      setIsLoading(false);
      return;
    }

    window.location.assign(result.checkoutUrl);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isLoading}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#1f6f5b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Opening checkout..." : cta}
      </button>
      {error && (
        <p className="mt-3 text-sm leading-6 text-[#b4442d]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const secondaryButtonClassName =
  "inline-flex h-12 w-full items-center justify-center rounded-lg border border-[#c9d8d2] bg-white px-4 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]";
