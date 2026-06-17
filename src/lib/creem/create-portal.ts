import { createRequestId, logger as defaultLogger } from "../logger.ts";

type PortalLogger = {
  info(input: Record<string, unknown>): void;
  error(input: Record<string, unknown>): void;
};

type PortalDependencies = {
  getUser(): Promise<{ id: string } | null>;
  getCustomerId(userId: string): Promise<string | null>;
  createPortal(customerId: string): Promise<{ portalUrl?: string }>;
  logger?: PortalLogger;
};

function response(body: Record<string, unknown>, status: number, requestId: string) {
  return Response.json(body, {
    status,
    headers: { "x-request-id": requestId },
  });
}

export function createPortalHandler({
  getUser,
  getCustomerId,
  createPortal,
  logger = defaultLogger,
}: PortalDependencies) {
  return async function POST(request: Request) {
    const requestId = createRequestId();
    let userId: string | undefined;
    let creemCustomerId: string | undefined;

    logger.info({
      event: "creem_portal_create_started",
      status: "started",
      message: "Creem customer portal creation started.",
      requestId,
    });

    try {
      const user = await getUser();
      if (!user) {
        logger.error({
          event: "creem_portal_create_failed",
          status: "error",
          message: "Creem customer portal requires authentication.",
          requestId,
          failureType: "unauthorized",
        });
        return response({ error: "Please log in to manage your subscription." }, 401, requestId);
      }

      userId = user.id;
      if ((await request.text()).trim()) {
        logger.error({
          event: "creem_portal_create_failed",
          status: "error",
          message: "Creem customer portal request contained unsupported fields.",
          requestId,
          userId,
          failureType: "unsupported_fields",
        });
        return response({ error: "This request does not accept customer data." }, 400, requestId);
      }

      const customerId = await getCustomerId(userId);
      if (!customerId) {
        logger.error({
          event: "creem_portal_create_failed",
          status: "error",
          message: "No Creem customer is available for this user.",
          requestId,
          userId,
          failureType: "missing_customer",
        });
        return response({ error: "You have no subscription to manage." }, 400, requestId);
      }
      creemCustomerId = customerId;

      const portal = await createPortal(customerId);
      if (!portal.portalUrl) {
        throw new Error("Creem did not return a customer portal URL.");
      }

      logger.info({
        event: "creem_portal_created",
        status: "success",
        message: "Creem customer portal was created.",
        requestId,
        userId,
        creemCustomerId,
      });
      return response({ portalUrl: portal.portalUrl }, 200, requestId);
    } catch (error) {
      logger.error({
        event: "creem_portal_create_failed",
        status: "error",
        message: "Creem customer portal creation failed.",
        requestId,
        userId,
        creemCustomerId,
        error,
      });
      return response({ error: "Could not open subscription management. Please try again." }, 502, requestId);
    }
  };
}
