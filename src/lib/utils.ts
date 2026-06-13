import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves the public-facing origin from env vars.
 * Vercel's NEXT_PUBLIC_VERCEL_URL does NOT include a protocol,
 * so we ensure https:// is always present.
 */
export function siteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "https://the-morning-money.vercel.app";
  return raw.startsWith("http") ? raw : `https://${raw}`;
}
