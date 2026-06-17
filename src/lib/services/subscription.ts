import type { CreemWebhookUpdate } from "../creem/webhook.ts";
import { logger as defaultLogger } from "../logger.ts";
import { createAdminClient } from "../supabase/admin.ts";

export type SubscriptionPlan =
  | "free"
  | "pro_monthly"
  | "pro_yearly"
  | "business";

export type UserPlan = "free" | "pro" | "business";

export type SubscriptionStatus =
  | "free"
  | "active"
  | "paid"
  | "trialing"
  | "scheduled_cancel"
  | "canceled"
  | "past_due"
  | "expired"
  | "paused";

export type UserSubscription = {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  creem_customer_id?: string | null;
  creem_subscription_id?: string | null;
  creem_product_id?: string | null;
  current_period_start?: string | null;
  current_period_end: string | null;
  next_transaction_date?: string | null;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
  last_transaction_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

type QueryResult<T> = PromiseLike<{ data: T; error: unknown }>;

export type SubscriptionDatabase = {
  from(table: "subscriptions"): {
    select(columns: string): {
      eq(column: "user_id", value: string): {
        maybeSingle(): QueryResult<UserSubscription | null>;
      };
    };
  };
  rpc(
    name: "process_creem_webhook",
    input: Record<string, unknown>,
  ): QueryResult<boolean | null>;
};

type DatabaseFactory = () => SubscriptionDatabase;
type SubscriptionLogger = {
  info(input: Record<string, unknown>): void;
  error(input: Record<string, unknown>): void;
};

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Unknown database error.";
}

export function isPremiumStatus(
  status: SubscriptionStatus,
  currentPeriodEnd: string | null | undefined,
  now = new Date(),
) {
  if (status === "paid" || status === "active" || status === "trialing") {
    return true;
  }

  if (status !== "scheduled_cancel" || !currentPeriodEnd) {
    return false;
  }

  const periodEnd = new Date(currentPeriodEnd);
  return !Number.isNaN(periodEnd.getTime()) && periodEnd.getTime() > now.getTime();
}

export function logFreeLimitReached(
  userId: string,
  logger: SubscriptionLogger = defaultLogger,
  requestId?: string,
) {
  logger.error({
    event: "free_limit_reached",
    status: "error",
    message: "The user reached the free usage limit.",
    userId,
    requestId,
  });
}

export function createSubscriptionService(
  createDatabase: DatabaseFactory,
  logger: SubscriptionLogger = defaultLogger,
) {
  async function getUserSubscription(userId: string) {
    if (!userId.trim()) {
      throw new Error("A userId is required to get a subscription.");
    }

    const { data, error } = await createDatabase()
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Could not load user subscription: ${errorMessage(error)}`);
    }

    return data;
  }

  async function hasActiveSubscription(userId: string) {
    const subscription = await getUserSubscription(userId);
    const hasAccess = subscription
      ? isPremiumStatus(subscription.status, subscription.current_period_end)
      : false;

    logger.info({
      event:
        !subscription || subscription.plan === "free"
          ? "subscription_required"
          : hasAccess
            ? "premium_access_granted"
            : "premium_access_denied",
      status: hasAccess ? "success" : "error",
      message: hasAccess
        ? "Premium access granted from the stored subscription."
        : "Premium access denied from the stored subscription.",
      userId,
      creemCustomerId: subscription?.creem_customer_id ?? null,
      creemSubscriptionId: subscription?.creem_subscription_id ?? null,
      creemProductId: subscription?.creem_product_id ?? null,
      subscriptionStatus: subscription?.status ?? "free",
    });

    return hasAccess;
  }

  async function getUserPlan(userId: string): Promise<UserPlan> {
    const subscription = await getUserSubscription(userId);

    if (
      !subscription ||
      !isPremiumStatus(subscription.status, subscription.current_period_end)
    ) {
      return "free";
    }

    if (subscription.plan === "business") {
      return "business";
    }

    return subscription.plan === "pro_monthly" ||
      subscription.plan === "pro_yearly"
      ? "pro"
      : "free";
  }

  async function upsertSubscriptionFromCreemEvent(event: CreemWebhookUpdate) {
    const { data, error } = await createDatabase().rpc(
      "process_creem_webhook",
      {
        p_event_id: event.eventId,
        p_event_type: event.eventType,
        p_user_id: event.userId,
        p_plan: event.plan,
        p_status: event.status,
        p_creem_customer_id: event.creemCustomerId,
        p_creem_subscription_id: event.creemSubscriptionId,
        p_creem_product_id: event.creemProductId,
        p_current_period_start: event.currentPeriodStart,
        p_current_period_end: event.currentPeriodEnd,
        p_next_transaction_date: event.nextTransactionDate,
        p_cancel_at_period_end: event.cancelAtPeriodEnd,
        p_canceled_at: event.canceledAt,
        p_last_transaction_id: event.lastTransactionId,
      },
    );

    if (error) {
      throw new Error(`Could not update subscription: ${errorMessage(error)}`);
    }

    return data ? "processed" : "duplicate";
  }

  return {
    upsertSubscriptionFromCreemEvent,
    getUserSubscription,
    getUserPlan,
    hasActiveSubscription,
  };
}

const subscriptionService = createSubscriptionService(
  () => createAdminClient() as unknown as SubscriptionDatabase,
);

export const upsertSubscriptionFromCreemEvent =
  subscriptionService.upsertSubscriptionFromCreemEvent;
export const getUserSubscription = subscriptionService.getUserSubscription;
export const getUserPlan = subscriptionService.getUserPlan;
export const hasActiveSubscription =
  subscriptionService.hasActiveSubscription;
