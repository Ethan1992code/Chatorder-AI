import { createRequestId, logger as defaultLogger } from "../logger.ts";
import {
  getCreemProductIdByPlanKey,
  getPlanByKey,
  isPaidPlan,
} from "../plans.ts";
import { getCreemConfig } from "./config.ts";

type Environment = Partial<Record<string, string | undefined>>;

type CheckoutInput = {
  productId: string;
  requestId: string;
  successUrl: string;
  metadata: {
    userId: string;
    referenceId: string;
    planKey: "pro_monthly" | "pro_yearly";
  };
};

type CheckoutResult = {
  checkoutUrl?: string;
};

type CheckoutLogger = {
  info(input: Record<string, unknown>): void;
  error(input: Record<string, unknown>): void;
};

type CheckoutDependencies = {
  getUser(): Promise<{ id: string } | null>;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  environment?: Environment;
  logger?: CheckoutLogger;
};

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  requestId: string,
) {
  return Response.json(body, {
    status,
    headers: { "x-request-id": requestId },
  });
}

export function createCheckoutHandler({
  getUser,
  createCheckout,
  environment = process.env,
  logger = defaultLogger,
}: CheckoutDependencies) {
  return async function POST(request: Request) {
    const requestId = createRequestId();
    let userId: string | undefined;
    let planKey: string | undefined;
    let creemProductId: string | undefined;

    logger.info({
      event: "creem_checkout_create_started",
      status: "started",
      message: "Creem checkout creation started.",
      requestId,
    });

    function fail(
      message: string,
      failureType: string,
      responseMessage: string,
      status: number,
    ) {
      logger.error({
        event: "creem_checkout_create_failed",
        status: "error",
        message,
        requestId,
        userId,
        planKey,
        failureType,
        creemProductId,
      });

      return jsonResponse({ error: responseMessage }, status, requestId);
    }

    try {
      const user = await getUser();

      if (!user) {
        return fail(
          "Creem checkout requires authentication.",
          "unauthorized",
          "Please log in to start checkout.",
          401,
        );
      }

      userId = user.id;

      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return fail(
          "Creem checkout request contained invalid JSON.",
          "invalid_json",
          "Invalid JSON body.",
          400,
        );
      }

      if (Object.keys(body).some((key) => key !== "planKey")) {
        return fail(
          "Creem checkout request contained unsupported fields.",
          "unsupported_fields",
          "Only planKey may be used to select a checkout plan.",
          400,
        );
      }

      planKey =
        typeof body.planKey === "string" ? body.planKey.trim() : undefined;
      const plan = planKey ? getPlanByKey(planKey) : null;

      if (!plan) {
        return fail(
          "Creem checkout request contained an invalid plan key.",
          "invalid_plan",
          "Invalid planKey.",
          400,
        );
      }

      if (!isPaidPlan(plan.planKey)) {
        return fail(
          "The selected plan cannot be purchased through Creem checkout.",
          "plan_not_purchasable",
          "This plan cannot be purchased through checkout.",
          400,
        );
      }

      const config = getCreemConfig(environment);
      const productId = getCreemProductIdByPlanKey(plan.planKey, environment);
      creemProductId = productId;
      const checkout = await createCheckout({
        productId,
        requestId,
        successUrl: `${config.appUrl.replace(/\/$/, "")}/billing/success`,
        metadata: {
          userId,
          referenceId: userId,
          planKey: plan.planKey,
        },
      });

      if (!checkout.checkoutUrl) {
        throw new Error("Creem did not return a checkout URL.");
      }

      logger.info({
        event: "creem_checkout_created",
        status: "success",
        message: "Creem checkout was created.",
        requestId,
        userId,
        planKey: plan.planKey,
        creemProductId,
      });

      return jsonResponse(
        { checkoutUrl: checkout.checkoutUrl },
        200,
        requestId,
      );
    } catch (error) {
      logger.error({
        event: "creem_checkout_create_failed",
        status: "error",
        message: "Creem checkout creation failed.",
        requestId,
        userId,
        planKey,
        creemProductId,
        error,
      });

      return jsonResponse(
        { error: "Could not create checkout. Please try again." },
        502,
        requestId,
      );
    }
  };
}
