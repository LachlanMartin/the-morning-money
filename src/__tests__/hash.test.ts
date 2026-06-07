import { describe, it, expect } from "vitest";
import { sourceHash } from "@/lib/hash";

describe("sourceHash", () => {
  it("returns a 32-character hex string", () => {
    const result = sourceHash("hello");
    expect(result).toHaveLength(32);
    expect(/^[a-f0-9]{32}$/.test(result)).toBe(true);
  });

  it("is deterministic — same input produces same hash", () => {
    const a = sourceHash("test-input");
    const b = sourceHash("test-input");
    expect(a).toBe(b);
  });

  it("different inputs produce different hashes", () => {
    const a = sourceHash("alpha");
    const b = sourceHash("beta");
    expect(a).not.toBe(b);
  });

  it("handles empty string", () => {
    const result = sourceHash("");
    expect(result).toHaveLength(32);
    expect(/^[a-f0-9]{32}$/.test(result)).toBe(true);
  });

  it("handles long input", () => {
    const long = "a".repeat(10000);
    const result = sourceHash(long);
    expect(result).toHaveLength(32);
  });
});
