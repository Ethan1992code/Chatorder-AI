import { createHmac, timingSafeEqual } from "node:crypto";
import { createRequestId, logger as defaultLogger } from "../logger.ts";

type Environment = Partial<Record<string, string | undefined>>;
type JsonObject = Record<string, unknown>;

export type CreemWebhookUpdate = {
  eventId: string;
  eventType: string;
  userId: string | null;
  plan: "pro_monthly" | "pro_yearly" | null;
  status:
    | "active"
    | "paid"
    | "scheduled_cancel"
    | "canceled"
    | "past_due"
    | "expired"
    | null;
  creemCustomerId: string | null;
  creemSubscriptionId: string | null;
  creemProductId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextTransactionDate: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  lastTransactionId: string | null;
};

type WebhookLogger = {
  info(input: Record<string, unknown>): void;
  error(input: Record<string, unknown>): void;
};

type WebhookDependencies = {
  processEvent(
    update: CreemWebhookUpdate,
  ): Promise<"processed" | "duplicate">;
  environment?: Environment;
  logger?: WebhookLogger;
};

const subscriptionStatuses = {
  "subscription.active": "active",
  "subscription.paid": "paid",
  "subscription.scheduled_cancel": "scheduled_cancel",
  "subscription.canceled": "canceled",
  "subscription.past_due": "past_due",
  "subscription.expired": "expired",
} as const;

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function string(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nestedString(value: unknown, key = "id") {
  return string(value) ?? string(object(value)[key]);
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const found = string(value);
    if (found) return found;
  }
  return null;
}

function metadataUserId(...sources: unknown[]) {
  for (const source of sources) {
    const value = object(source);
    const userId = firstString(
      value.userId,
      value.user_id,
      value.referenceId,
      value.reference_id,
      value.internalCustomerId,
      value.internal_customer_id,
    );
    if (userId) return userId;
  }
  return null;
}

function planForProduct(productId: string | null, environment: Environment) {
  if (productId === environment.CREEM_PRODUCT_ID_PRO_MONTHLY?.trim()) {
    return "pro_monthly" as const;
  }
  if (productId === environment.CREEM_PRODUCT_ID_PRO_YEARLY?.trim()) {
    return "pro_yearly" as const;
  }
  return null;
}

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  return (
    expectedBuffer.length === signatureBuffer.length &&
    timingSafeEqual(expectedBuffer, signatureBuffer)
  );
}

function buildUpdate(payload: JsonObject, environment: Environment) {
  const eventId = string(payload.id);
  const eventType = string(payload.eventType);
  if (!eventId || !eventType) {
    throw new Error("Creem webhook is missing id or eventType.");
  }

  const eventObject = object(payload.object);
  const riskSubscription = object(eventObject.subscription);
  const subscription = eventType.startsWith("subscription.")
    ? eventObject
    : riskSubscription;
  const checkout = eventType === "checkout.completed" ? eventObject : object(eventObject.checkout);
  const transaction = object(eventObject.transaction);

  const productId =
    nestedString(subscription.product) ??
    nestedString(checkout.product) ??
    nestedString(eventObject.product) ??
    nestedString(object(checkout.order).product);
  const customerId =
    nestedString(subscription.customer) ??
    nestedString(checkout.customer) ??
    nestedString(eventObject.customer) ??
    nestedString(object(checkout.order).customer);
  const subscriptionId =
    string(subscription.id) ??
    nestedString(checkout.subscription) ??
    string(transaction.subscription);
  const status =
    eventType === "refund.created" || eventType === "dispute.created"
      ? "past_due"
      : subscriptionStatuses[eventType as keyof typeof subscriptionStatuses] ??
        null;

  return {
    eventId,
    eventType,
    userId: metadataUserId(
      subscription.metadata,
      subscription.requestData,
      subscription.request_data,
      checkout.metadata,
      checkout.requestData,
      checkout.request_data,
    ),
    plan: planForProduct(productId, environment),
    status,
    creemCustomerId: customerId,
    creemSubscriptionId: subscriptionId,
    creemProductId: productId,
    currentPeriodStart: firstString(
      subscription.current_period_start_date,
      subscription.currentPeriodStartDate,
    ),
    currentPeriodEnd: firstString(
      subscription.current_period_end_date,
      subscription.currentPeriodEndDate,
    ),
    nextTransactionDate: firstString(
      subscription.next_transaction_date,
      subscription.nextTransactionDate,
    ),
    cancelAtPeriodEnd: eventType === "subscription.scheduled_cancel",
    canceledAt: firstString(subscription.canceled_at, subscription.canceledAt),
    lastTransactionId: firstString(
      subscription.last_transaction_id,
      subscription.lastTransactionId,
      transaction.id,
    ),
  } satisfies CreemWebhookUpdate;
}

export function createCreemWebhookHandler({
  processEvent,
  environment = process.env,
  logger = defaultLogger,
}: WebhookDependencies) {
  return async function POST(request: Request) {
    const requestId = createRequestId();
    const rawBody = await request.text();
    const signature = request.headers.get("creem-signature");
    const secret = environment.CREEM_WEBHOOK_SECRET?.trim();

    logger.info({
      event: "creem_webhook_received",
      status: "started",
      message: "Creem webhook received.",
      requestId,
    });

    if (!signature || !secret || !verifySignature(rawBody, signature, secret)) {
      logger.error({
        event: "creem_webhook_signature_failed",
        status: "error",
        message: "Creem webhook signature verification failed.",
        requestId,
      });
      return Response.json({ error: "Invalid signature." }, { status: 400 });
    }

    logger.info({
      event: "creem_webhook_signature_verified",
      status: "success",
      message: "Creem webhook signature verified.",
      requestId,
    });

    let update: CreemWebhookUpdate | undefined;
    try {
      update = buildUpdate(JSON.parse(rawBody) as JsonObject, environment);
      const result = await processEvent(update);

      if (result === "duplicate") {
        logger.info({
          event: "creem_webhook_duplicate_ignored",
          status: "success",
          message: "Duplicate Creem webhook ignored.",
          requestId,
          webhookEventId: update.eventId,
          eventType: update.eventType,
          userId: update.userId ?? undefined,
          creemCustomerId: update.creemCustomerId,
          creemSubscriptionId: update.creemSubscriptionId,
          creemProductId: update.creemProductId,
        });
        return Response.json({ received: true, duplicate: true });
      }

      const lifecycleLog = {
        "subscription.paid": "creem_subscription_paid",
        "subscription.active": "creem_subscription_active",
        "subscription.scheduled_cancel":
          "creem_subscription_scheduled_cancel",
        "subscription.canceled": "creem_subscription_canceled",
        "subscription.past_due": "creem_subscription_past_due",
        "subscription.expired": "creem_subscription_expired",
      }[update.eventType];

      if (lifecycleLog) {
        logger.info({
          event: lifecycleLog,
          status: "success",
          message: `Creem event ${update.eventType} synchronized.`,
          requestId,
          userId: update.userId ?? undefined,
          webhookEventId: update.eventId,
          creemCustomerId: update.creemCustomerId,
          creemSubscriptionId: update.creemSubscriptionId,
          creemProductId: update.creemProductId,
        });
      }

      logger.info({
        event: "creem_webhook_processed",
        status: "success",
        message: "Creem webhook processed.",
        requestId,
        userId: update.userId ?? undefined,
        webhookEventId: update.eventId,
        eventType: update.eventType,
        creemCustomerId: update.creemCustomerId,
        creemSubscriptionId: update.creemSubscriptionId,
        creemProductId: update.creemProductId,
      });
      return Response.json({ received: true });
    } catch (error) {
      logger.error({
        event: "creem_webhook_process_failed",
        status: "error",
        message: "Creem webhook processing failed.",
        requestId,
        userId: update?.userId ?? undefined,
        webhookEventId: update?.eventId,
        eventType: update?.eventType,
        creemCustomerId: update?.creemCustomerId,
        creemSubscriptionId: update?.creemSubscriptionId,
        creemProductId: update?.creemProductId,
        error,
      });
      return Response.json(
        { error: "Webhook processing failed." },
        { status: 500 },
      );
    }
  };
}
