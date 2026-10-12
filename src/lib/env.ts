// Public build-time configuration (all NEXT_PUBLIC_*, no secrets) and static asset URLs.

/** '' locally, '/Vyora' on GitHub Pages. Must match next.config.ts basePath. */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** Fitora web app ("Sửa hồ sơ trong Fitora", menu "Mở Fitora"). */
export const FITORA_URL = process.env.NEXT_PUBLIC_FITORA_URL || "https://nguyenngoctuyen11032003.github.io/Fitora/";

/** Prefixes a /public path with the basePath (plain <img> / CSS urls do not get it automatically). */
export function asset(path: string): string {
  return `${BASE_PATH}${path.startsWith("/") ? path : `/${path}`}`;
}

export const LOGO_SRC = "/image/logo.png";

/** Page background of the F1 template — fallback when the day's first exercise has no video. */
export const F1_BACKGROUND_URL =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260709_152331_bd312d1a-1f20-46b9-9b68-12bcdcf6d53e.png&w=1280&q=85";
