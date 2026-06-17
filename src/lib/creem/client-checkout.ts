export type CheckoutPlanKey = "pro_monthly" | "pro_yearly";

type CheckoutResult =
  | { status: "success"; checkoutUrl: string }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

export async function requestCheckout(
  planKey: CheckoutPlanKey,
  fetcher: typeof fetch = fetch,
): Promise<CheckoutResult> {
  try {
    const response = await fetcher("/api/creem/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey }),
    });

    if (response.status === 401) {
      return { status: "unauthorized" };
    }

    const body = (await response.json().catch(() => null)) as {
      checkoutUrl?: string;
      error?: string;
    } | null;

    if (!response.ok || !body?.checkoutUrl) {
      return {
        status: "error",
        message: body?.error ?? "Could not create checkout. Please try again.",
      };
    }

    return { status: "success", checkoutUrl: body.checkoutUrl };
  } catch {
    return {
      status: "error",
      message: "Could not connect to checkout. Please try again.",
    };
  }
}
