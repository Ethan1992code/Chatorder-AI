export const planKeys = [
  "free",
  "pro_monthly",
  "pro_yearly",
  "business",
] as const;

export type PlanKey = (typeof planKeys)[number];
export type PlanInterval = "month" | "year" | "custom";
export type PlanPrice = number | "Contact us";
export type MonthlyReplyLimit = number | "custom";

export type Plan = {
  planKey: PlanKey;
  name: string;
  price: PlanPrice;
  interval: PlanInterval;
  description: string;
  aiRepliesPerMonth: MonthlyReplyLimit;
  premiumFeatures: boolean;
  creemProductId: string | null;
  cta: string;
};

export type PaidPlan = Plan & {
  planKey: "pro_monthly" | "pro_yearly";
};

type ProductEnvironment = Partial<Record<string, string | undefined>>;

export const plans = [
  {
    planKey: "free",
    name: "Free",
    price: 0,
    interval: "month",
    description: "适合刚开始体验 AI 私信回复的新用户",
    aiRepliesPerMonth: 20,
    premiumFeatures: false,
    creemProductId: null,
    cta: "Start for free",
  },
  {
    planKey: "pro_monthly",
    name: "Pro Monthly",
    price: 9,
    interval: "month",
    description: "适合每天都需要回复客户私信的小商家",
    aiRepliesPerMonth: 1000,
    premiumFeatures: true,
    creemProductId: process.env.CREEM_PRODUCT_ID_PRO_MONTHLY?.trim() || null,
    cta: "Start Pro Monthly",
  },
  {
    planKey: "pro_yearly",
    name: "Pro Yearly",
    price: 90,
    interval: "year",
    description: "适合长期使用的商家，相当于买 10 个月送 2 个月",
    aiRepliesPerMonth: 1000,
    premiumFeatures: true,
    creemProductId: process.env.CREEM_PRODUCT_ID_PRO_YEARLY?.trim() || null,
    cta: "Start Pro Yearly",
  },
  {
    planKey: "business",
    name: "Business",
    price: "Contact us",
    interval: "custom",
    description: "适合团队、代理商、门店连锁、外贸团队",
    aiRepliesPerMonth: "custom",
    premiumFeatures: true,
    creemProductId: null,
    cta: "Contact us",
  },
] as const satisfies readonly Plan[];

const paidPlanKeys = new Set<PlanKey>(["pro_monthly", "pro_yearly"]);

export function getPlanByKey(planKey: string) {
  return plans.find((plan) => plan.planKey === planKey) ?? null;
}

export function isPaidPlan(planKey: string): planKey is PaidPlan["planKey"] {
  return paidPlanKeys.has(planKey as PlanKey);
}

export function getPaidPlanByKey(planKey: string): PaidPlan | null {
  const plan = getPlanByKey(planKey);

  return plan && isPaidPlan(plan.planKey) ? (plan as PaidPlan) : null;
}

export function getCreemProductIdByPlanKey(
  planKey: string,
  environment: ProductEnvironment = process.env,
) {
  const plan = getPlanByKey(planKey);

  if (!plan) {
    throw new Error(`Unknown plan key: ${planKey}`);
  }

  if (!isPaidPlan(plan.planKey)) {
    throw new Error(`Plan ${plan.planKey} cannot be purchased through checkout.`);
  }

  const environmentName =
    plan.planKey === "pro_monthly"
      ? "CREEM_PRODUCT_ID_PRO_MONTHLY"
      : "CREEM_PRODUCT_ID_PRO_YEARLY";
  const productId = environment[environmentName]?.trim();

  if (!productId) {
    throw new Error(`${environmentName} is not configured.`);
  }

  return productId;
}
