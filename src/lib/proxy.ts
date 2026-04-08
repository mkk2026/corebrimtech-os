/**
 * Shared headers for /api/ai proxy calls.
 * Includes auth token when API_PROXY_SECRET is configured.
 */
export function proxyHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const secret =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_PROXY_SECRET ?? "")
      : "";
  if (secret) {
    headers["x-proxy-token"] = secret;
  }
  return headers;
}
