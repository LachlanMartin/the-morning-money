import { describe, it, expect } from "vitest";
import { validateAnalysisResult } from "@/lib/analysis";

describe("validateAnalysisResult", () => {
  it("accepts valid summaryMd", () => {
    const result = validateAnalysisResult({ summaryMd: "A summary" });
    expect(result.summaryMd).toBe("A summary");
  });

  it("trims whitespace from summaryMd", () => {
    const result = validateAnalysisResult({ summaryMd: "  trimmed  " });
    expect(result.summaryMd).toBe("trimmed");
  });

  it("rejects empty string", () => {
    expect(() => validateAnalysisResult({ summaryMd: "" })).toThrow(
      "Invalid or missing summaryMd",
    );
  });

  it("rejects whitespace only", () => {
    expect(() => validateAnalysisResult({ summaryMd: "   " })).toThrow(
      "Invalid or missing summaryMd",
    );
  });

  it("rejects non-string", () => {
    expect(() => validateAnalysisResult({ summaryMd: 123 as unknown as string })).toThrow(
      "Invalid or missing summaryMd",
    );
  });

  it("ignores extra fields silently", () => {
    const result = validateAnalysisResult({
      summaryMd: "Valid summary.",
      sentiment: "BULLISH",
      confidence: 999,
    });
    expect(result.summaryMd).toBe("Valid summary.");
  });
});
