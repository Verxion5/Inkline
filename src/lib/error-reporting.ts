/**
 * Error reporting hook for React error boundaries.
 * Logs to console so any external monitoring can pick it up.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  console.error("[Inkline]", message, { ...context, stack: error instanceof Error ? error.stack : undefined });
}
