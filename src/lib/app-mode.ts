export function isLocalMode(): boolean {
  return process.env.NEXT_PUBLIC_APP_MODE === "local";
}
