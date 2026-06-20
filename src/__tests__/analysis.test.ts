import { describe, it, expect } from "vitest";
import { validateAnalysisResult } from "@/lib/analysis";

const validResponse = `## Major partnership opens Asian distribution channels

The company announced a new partnership with a major international distributor, expected to close in Q3. Revenue guidance was raised by **15%** for FY27.

This positions the company to capture share in the Asian market without significant upfront capex. _Margin expansion_ is expected as the partnership shifts toward higher-margin recurring revenue.

{"sentiment":"POSITIVE","predictedDirection":"UP","confidence":0.82}`;

describe("validateAnalysisResult", () => {
  it("accepts valid response with all fields", () => {
    const result = validateAnalysisResult(validResponse);
    expect(result.summaryMd).toContain("## Major partnership");
    expect(result.sentiment).toBe("POSITIVE");
    expect(result.predictedDirection).toBe("UP");
    expect(result.confidence).toBe(0.82);
  });

  it("rejects response without JSON block", () => {
    expect(() =>
      validateAnalysisResult("Just some text without JSON"),
    ).toThrow("No JSON block found");
  });

  it("rejects invalid sentiment", () => {
    expect(() =>
      validateAnalysisResult(`Summary text.

{"sentiment":"BULLISH","predictedDirection":"UP","confidence":0.5}`),
    ).toThrow("Invalid sentiment");
  });

  it("rejects invalid predictedDirection", () => {
    expect(() =>
      validateAnalysisResult(`Summary text.

{"sentiment":"POSITIVE","predictedDirection":"SIDEWAYS","confidence":0.5}`),
    ).toThrow("Invalid predictedDirection");
  });

  it("rejects confidence out of range", () => {
    expect(() =>
      validateAnalysisResult(`Summary text.

{"sentiment":"POSITIVE","predictedDirection":"UP","confidence":1.5}`),
    ).toThrow("Invalid confidence");
  });

  it("rejects negative confidence", () => {
    expect(() =>
      validateAnalysisResult(`Summary text.

{"sentiment":"POSITIVE","predictedDirection":"UP","confidence":-0.1}`),
    ).toThrow("Invalid confidence");
  });

  it("accepts NEGATIVE sentiment with FLAT direction", () => {
    const result = validateAnalysisResult(`Summary text.

{"sentiment":"NEGATIVE","predictedDirection":"FLAT","confidence":0.4}`);
    expect(result.sentiment).toBe("NEGATIVE");
    expect(result.predictedDirection).toBe("FLAT");
    expect(result.confidence).toBe(0.4);
  });

  it("accepts NEUTRAL sentiment with DOWN direction", () => {
    const result = validateAnalysisResult(`Summary text.

{"sentiment":"NEUTRAL","predictedDirection":"DOWN","confidence":0.55}`);
    expect(result.sentiment).toBe("NEUTRAL");
    expect(result.predictedDirection).toBe("DOWN");
    expect(result.confidence).toBe(0.55);
  });
});
