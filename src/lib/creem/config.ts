type CreemEnvironment = Partial<Record<string, string | undefined>>;

function requireEnvironmentVariable(
  environment: CreemEnvironment,
  name: string,
) {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function getTestMode(environment: CreemEnvironment) {
  const configuredValue = environment.CREEM_TEST_MODE?.trim().toLowerCase();

  if (!configuredValue) {
    return environment.NODE_ENV !== "production";
  }

  if (configuredValue === "true") {
    return true;
  }

  if (configuredValue === "false") {
    return false;
  }

  throw new Error("CREEM_TEST_MODE must be true or false.");
}

export function getCreemConfig(
  environment: CreemEnvironment = process.env,
) {
  return {
    apiKey: requireEnvironmentVariable(environment, "CREEM_API_KEY"),
    webhookSecret: requireEnvironmentVariable(
      environment,
      "CREEM_WEBHOOK_SECRET",
    ),
    productIds: {
      proMonthly: requireEnvironmentVariable(
        environment,
        "CREEM_PRODUCT_ID_PRO_MONTHLY",
      ),
      proYearly: requireEnvironmentVariable(
        environment,
        "CREEM_PRODUCT_ID_PRO_YEARLY",
      ),
    },
    appUrl: requireEnvironmentVariable(environment, "NEXT_PUBLIC_APP_URL"),
    testMode: getTestMode(environment),
  };
}
