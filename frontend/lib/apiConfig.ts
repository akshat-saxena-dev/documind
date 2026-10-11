/**
 * Client-side API base URL.
 * In the browser, an empty string allows same-origin requests (e.g. `/api/v1/...`),
 * which are proxied seamlessly to the backend via Next.js rewrites, ensuring all
 * session cookies remain same-origin and completely immune to third-party cookie blocking.
 *
 * During SSR or if explicitly overridden, NEXT_PUBLIC_API_URL can still be used.
 */
export const API_URL =
  typeof window !== "undefined"
    ? ""
    : process.env.NEXT_PUBLIC_API_URL || "https://documind-api-jlb7.onrender.com";
