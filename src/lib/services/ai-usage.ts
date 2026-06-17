import { logger as defaultLogger } from "../logger.ts";
import { createAdminClient } from "../supabase/admin.ts";
import {
  getUserPlan as getStoredUserPlan,
  type UserPlan,
} from "./subscription.ts";

const FREE_MONTHLY_LIMIT = 20;
const PRO_MONTHLY_LIMIT = 1000;

type UsageDatabase = {
  rpc(
    name:
      | "reserve_generate_reply_usage"
      | "confirm_generate_reply_usage"
      | "release_generate_reply_usage",
    input: Record<string, unknown>,
  ): PromiseLike<{ data: boolean | null; error: unknown }>;
};

type UsageLogger = {
  info(input: Record<string, unknown>): void;
  error(input: Record<string, unknown>): void;
};

type UsageDependencies = {
  createDatabase: () => UsageDatabase;
  getUserPlan: (userId: string) => Promise<UserPlan>;
  now?: () => Date;
  logger?: UsageLogger;
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

function monthlyLimitForPlan(plan: UserPlan) {
  return plan === "free" ? FREE_MONTHLY_LIMIT : PRO_MONTHLY_LIMIT;
}

export function createAiUsageService({
  createDatabase,
  getUserPlan,
  now = () => new Date(),
  logger = defaultLogger,
}: UsageDependencies) {
  async function runUsageRpc(
    name:
      | "confirm_generate_reply_usage"
      | "release_generate_reply_usage",
    userId: string,
    usageMonth: string,
  ) {
    const { data, error } = await createDatabase().rpc(name, {
      p_user_id: userId,
      p_usage_month: usageMonth,
    });

    if (error || !data) {
      throw new Error(
        `Could not update monthly AI usage: ${errorMessage(error)}`,
      );
    }
  }

  async function reserveGenerateReply(userId: string, requestId?: string) {
    const plan = await getUserPlan(userId);
    const limit = monthlyLimitForPlan(plan);
    const usageMonth = now().toISOString().slice(0, 7);
    const { data, error } = await createDatabase().rpc(
      "reserve_generate_reply_usage",
      {
        p_user_id: userId,
        p_usage_month: usageMonth,
        p_limit: limit,
      },
    );

    if (error) {
      throw new Error(
        `Could not check monthly AI usage: ${errorMessage(error)}`,
      );
    }

    const allowed = data === true;
    if (!allowed) {
      logger.error({
        event:
          plan === "free"
            ? "free_limit_reached"
            : "ai_reply_monthly_limit_reached",
        status: "error",
        message: "The user reached the monthly AI reply limit.",
        userId,
        requestId,
        plan,
        usageMonth,
        limit,
      });
    }

    return { allowed, usageMonth, limit };
  }

  async function confirmGenerateReply(userId: string, usageMonth: string) {
    await runUsageRpc(
      "confirm_generate_reply_usage",
      userId,
      usageMonth,
    );
  }

  async function releaseGenerateReply(userId: string, usageMonth: string) {
    await runUsageRpc(
      "release_generate_reply_usage",
      userId,
      usageMonth,
    );
  }

  return {
    reserveGenerateReply,
    confirmGenerateReply,
    releaseGenerateReply,
  };
}

const aiUsageService = createAiUsageService({
  createDatabase: () => createAdminClient() as unknown as UsageDatabase,
  getUserPlan: getStoredUserPlan,
});

export const reserveGenerateReply = aiUsageService.reserveGenerateReply;
export const confirmGenerateReply = aiUsageService.confirmGenerateReply;
export const releaseGenerateReply = aiUsageService.releaseGenerateReply;
