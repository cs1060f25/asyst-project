export function getSiteUrl(): string {
  // Prefer explicit site URL if provided
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.trim().length > 0) return explicit.replace(/\/$/, "");

  // Vercel provides NEXT_PUBLIC_VERCEL_URL without scheme
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel && vercel.trim().length > 0) return `https://${vercel.replace(/\/$/, "")}`;

  // Fallback to browser origin if available (dev)
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  // Last resort
  return "";
}

export function getAuthCallbackUrl(): string {
  const base = getSiteUrl();
  return base ? `${base}/auth/callback` : "/auth/callback";
}
