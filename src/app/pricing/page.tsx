import Link from "next/link";
import { PricingActions } from "@/components/billing/PricingActions";
import { plans } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

function formatPrice(price: number | "Contact us") {
  return typeof price === "number" ? `$${price}` : price;
}

function formatInterval(interval: "month" | "year" | "custom") {
  return interval === "custom" ? "Custom plan" : `per ${interval}`;
}

function formatReplyLimit(limit: number | "custom") {
  return limit === "custom"
    ? "Custom AI reply allowance"
    : `${limit.toLocaleString()} AI replies each month`;
}

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-[#fbfdfb] text-[#17231f]">
      <header className="border-b border-[#dce9e4] bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold">
            <span className="grid size-9 place-items-center rounded-lg bg-[#1f6f5b] text-sm font-bold text-white">
              CO
            </span>
            <span>ChatOrder AI</span>
          </Link>
          <Link
            href={user ? "/dashboard" : "/login?next=/pricing"}
            className="rounded-lg border border-[#c9d8d2] bg-white px-4 py-2 text-sm font-semibold text-[#1f342d] transition hover:border-[#93b6a8]"
          >
            {user ? "Dashboard" : "Log in"}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Simple plans for faster customer replies.
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#536962]">
            Start free, then choose a Pro plan when customer conversations
            become part of your daily sales workflow.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isPro = plan.planKey.startsWith("pro_");

            return (
              <article
                key={plan.planKey}
                className={`flex min-h-[440px] flex-col rounded-lg border bg-white p-6 shadow-sm ${
                  isPro
                    ? "border-[#93b6a8] shadow-[0_18px_50px_rgba(31,111,91,0.12)]"
                    : "border-[#dce9e4]"
                }`}
              >
                <div>
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-tight">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="pb-1 text-sm text-[#667a73]">
                      {formatInterval(plan.interval)}
                    </span>
                  </div>
                  <p className="mt-5 min-h-18 text-sm leading-6 text-[#536962]">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-7 border-t border-[#e1ece7] pt-6">
                  <p className="text-sm font-semibold text-[#1f6f5b]">
                    {formatReplyLimit(plan.aiRepliesPerMonth)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[#536962]">
                    {plan.premiumFeatures
                      ? "Includes premium sales reply features."
                      : "Includes the core AI reply workflow."}
                  </p>
                </div>

                <div className="mt-auto pt-8">
                  <PricingActions
                    planKey={plan.planKey}
                    cta={plan.cta}
                    isAuthenticated={Boolean(user)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
