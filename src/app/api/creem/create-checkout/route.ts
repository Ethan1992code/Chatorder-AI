import { createCheckoutHandler } from "@/lib/creem/create-checkout";
import { getCreemConfig } from "@/lib/creem/config";
import { createClient } from "@/lib/supabase/server";

export const POST = createCheckoutHandler({
  async getUser() {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user ? { id: user.id } : null;
  },
  async createCheckout(input) {
    const config = getCreemConfig();
    const baseUrl = config.testMode
      ? "https://test-api.creem.io"
      : "https://api.creem.io";
    const response = await fetch(`${baseUrl}/v1/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify({
        product_id: input.productId,
        request_id: input.requestId,
        success_url: input.successUrl,
        metadata: input.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Creem checkout request failed with ${response.status}.`);
    }

    const checkout = (await response.json()) as { checkout_url?: string };
    return { checkoutUrl: checkout.checkout_url };
  },
});
