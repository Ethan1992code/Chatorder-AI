import { createPortalHandler } from "@/lib/creem/create-portal";
import { getCreemConfig } from "@/lib/creem/config";
import {
  createSubscriptionService,
  type SubscriptionDatabase,
} from "@/lib/services/subscription";
import { createClient } from "@/lib/supabase/server";

export const POST = createPortalHandler({
  async getUser() {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id } : null;
  },
  async getCustomerId(userId) {
    const supabase = await createClient();
    const service = createSubscriptionService(
      () => supabase as unknown as SubscriptionDatabase,
    );
    const subscription = await service.getUserSubscription(userId);
    return subscription?.creem_customer_id ?? null;
  },
  async createPortal(customerId) {
    const config = getCreemConfig();
    const baseUrl = config.testMode
      ? "https://test-api.creem.io"
      : "https://api.creem.io";
    const response = await fetch(`${baseUrl}/v1/customers/billing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({ customer_id: customerId }),
    });

    if (!response.ok) {
      throw new Error(`Creem portal request failed with ${response.status}.`);
    }

    const portal = (await response.json()) as {
      customer_portal_link?: string;
    };
    return { portalUrl: portal.customer_portal_link };
  },
});
