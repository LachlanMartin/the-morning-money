import { createHash } from "node:crypto";

export function sourceHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 32);
}
