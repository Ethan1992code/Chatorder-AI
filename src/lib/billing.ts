import {
  isPremiumStatus,
  type UserSubscription,
} from "./services/subscription.ts";

const planLabels = {
  free: "Free",
  pro_monthly: "Pro Monthly",
  pro_yearly: "Pro Yearly",
  business: "Business",
} as const;

export function getBillingSummary(subscription: UserSubscription | null) {
  if (!subscription) {
    return {
      plan: "Free",
      status: "free",
      isActive: false,
      currentPeriodEnd: null,
      nextTransactionDate: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      needsResubscribe: false,
      canManageSubscription: false,
    } as const;
  }

  const isActive = isPremiumStatus(
    subscription.status,
    subscription.current_period_end,
  );

  return {
    plan: planLabels[subscription.plan],
    status: subscription.status,
    isActive,
    currentPeriodEnd: subscription.current_period_end ?? null,
    nextTransactionDate: subscription.next_transaction_date ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    canceledAt: subscription.canceled_at ?? null,
    needsResubscribe: subscription.plan !== "free" && !isActive,
    canManageSubscription: Boolean(subscription.creem_customer_id),
  } as const;
}
