/** Only explicit configuration or Vercel's trusted runtime variables set URLs. */
export function applicationUrl(env = process.env) {
  const deployment =
    env.VERCEL_ENV === "production"
      ? env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL
      : env.VERCEL_URL;
  const value =
    env.APP_URL ||
    (env.VERCEL && deployment
      ? `https://${deployment}`
      : "http://localhost:3000");
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "APP_URL must be the application origin, without path, credentials or query.",
    );
  if (env.VERCEL && url.protocol !== "https:")
    throw new Error("APP_URL must use HTTPS on Vercel.");
  return url.origin;
}
