import { createCreemWebhookHandler } from "@/lib/creem/webhook";
import { upsertSubscriptionFromCreemEvent } from "@/lib/services/subscription";

export const runtime = "nodejs";

export const POST = createCreemWebhookHandler({
  processEvent: upsertSubscriptionFromCreemEvent,
});
