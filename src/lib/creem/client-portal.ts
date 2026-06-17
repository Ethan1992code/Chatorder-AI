type PortalResult =
  | { status: "success"; portalUrl: string }
  | { status: "unauthorized" }
  | { status: "error"; message: string };

export async function requestPortal(
  fetcher: typeof fetch = fetch,
): Promise<PortalResult> {
  try {
    const response = await fetcher("/api/creem/create-portal", {
      method: "POST",
    });

    if (response.status === 401) return { status: "unauthorized" };

    const body = (await response.json().catch(() => null)) as {
      portalUrl?: string;
      error?: string;
    } | null;

    if (!response.ok || !body?.portalUrl) {
      return {
        status: "error",
        message: body?.error ?? "Could not open subscription management.",
      };
    }

    return { status: "success", portalUrl: body.portalUrl };
  } catch {
    return {
      status: "error",
      message: "Could not connect to subscription management.",
    };
  }
}
