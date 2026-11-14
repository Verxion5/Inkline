/**
 * Bearer-token guard for scheduled/cron endpoints.
 * Compares the request token against CRON_SECRET with a constant-time digest
 * comparison, and still accepts the previous secret while it is being rotated
 * out (CRON_SECRET_PREVIOUS).
 */
export async function authenticateCronRequest(request: Request): Promise<Response | null> {
  const currentSecret = process.env["CRON_SECRET"];
  const previousSecret = process.env["CRON_SECRET_PREVIOUS"];

  if (!currentSecret) {
    return new Response("Server configuration error: CRON_SECRET is not set.", { status: 500 });
  }

  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  const token = match?.[1];
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { createHash, timingSafeEqual } = await import("node:crypto");
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  const providedDigest = digest(token);
  const currentMatches = timingSafeEqual(providedDigest, digest(currentSecret));
  const previousMatches =
    Boolean(previousSecret) && timingSafeEqual(providedDigest, digest(previousSecret!));

  if (!currentMatches && !previousMatches) {
    return new Response("Unauthorized", { status: 401 });
  }

  return null;
}
