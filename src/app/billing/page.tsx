import Link from "next/link";
import { redirect } from "next/navigation";
import { ManageSubscriptionButton } from "@/components/billing/ManageSubscriptionButton";
import { getBillingSummary } from "@/lib/billing";
import {
  createSubscriptionService,
  type SubscriptionDatabase,
} from "@/lib/services/subscription";
import { createClient } from "@/lib/supabase/server";

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/billing");
  }

  const subscriptionService = createSubscriptionService(
    () => supabase as unknown as SubscriptionDatabase,
  );
  let subscription = null;
  let billingUnavailable = false;

  try {
    subscription = await subscriptionService.getUserSubscription(user.id);
  } catch {
    billingUnavailable = true;
  }
  const billing = getBillingSummary(subscription);
  const displayedPlan = billingUnavailable ? "Unavailable" : billing.plan;
  const details = [
    ["Current plan", displayedPlan],
    [
      "Subscription status",
      billingUnavailable ? "Unavailable" : formatStatus(billing.status),
    ],
    ["Active", billingUnavailable ? "Unavailable" : billing.isActive ? "Yes" : "No"],
    [
      "Current period ends",
      billingUnavailable ? "Unavailable" : formatDate(billing.currentPeriodEnd),
    ],
    [
      "Next transaction",
      billingUnavailable ? "Unavailable" : formatDate(billing.nextTransactionDate),
    ],
    [
      "Cancel at period end",
      billingUnavailable ? "Unavailable" : billing.cancelAtPeriodEnd ? "Yes" : "No",
    ],
    [
      "Canceled at",
      billingUnavailable ? "Unavailable" : formatDate(billing.canceledAt),
    ],
  ];

  return (
    <main className="min-h-screen bg-[#fbfdfb] text-[#17231f]">
      <header className="border-b border-[#dce9e4] bg-white/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid size-9 place-items-center rounded-lg bg-[#1f6f5b] text-sm font-bold text-white">
              CO
            </span>
            <span>ChatOrder AI</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-[#c9d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1f6f5b]">
          Billing
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
          Subscription and billing details
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#536962]">
          This page reflects the subscription state stored after Creem webhook
          processing.
        </p>

        <section className="mt-9 rounded-lg border border-[#dce9e4] bg-white p-6 shadow-sm sm:p-8">
          {billingUnavailable && (
            <div className="mb-7 rounded-lg border border-[#ead1c7] bg-[#fff8f5] p-4 text-sm leading-6 text-[#7d3c2d]">
              Billing details are temporarily unavailable. Please try again
              later or review the available plans.
            </div>
          )}
          <div className="flex flex-col gap-5 border-b border-[#e1ece7] pb-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#667a73]">Current plan</p>
              <h2 className="mt-2 text-3xl font-semibold">{displayedPlan}</h2>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${
                billing.isActive
                  ? "bg-[#eaf7f0] text-[#1f6f5b]"
                  : "bg-[#f7eee9] text-[#a04d39]"
              }`}
            >
              {billingUnavailable
                ? "Unavailable"
                : billing.isActive
                  ? "Active"
                  : "Not active"}
            </span>
          </div>

          <dl className="mt-7 grid gap-4 sm:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-[#f6faf8] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#667a73]">
                  {label}
                </dt>
                <dd className="mt-2 text-sm font-semibold capitalize text-[#1f342d]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {billing.needsResubscribe && (
            <div className="mt-7 rounded-lg border border-[#ead1c7] bg-[#fff8f5] p-4 text-sm leading-6 text-[#7d3c2d]">
              This subscription needs attention. Choose a plan again to restore
              access after payment is confirmed.
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ManageSubscriptionButton
              enabled={!billingUnavailable && billing.canManageSubscription}
            />
            {(billingUnavailable ||
              billing.needsResubscribe ||
              billing.plan === "Free") && (
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-[#1f6f5b] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#175846]"
              >
                View pricing
              </Link>
            )}
          </div>
          {!billing.canManageSubscription && !billingUnavailable && (
            <p className="mt-3 text-xs leading-5 text-[#667a73]">
              There is no Creem subscription available to manage yet.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
