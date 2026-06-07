import { describe, it, expect } from "vitest";
import { extractJson, validateAnalysisResult } from "@/lib/analysis";

describe("validateAnalysisResult", () => {
  it("accepts valid analysis result", () => {
    const result = validateAnalysisResult({
      summaryMd: "A summary",
      sentiment: "POSITIVE",
      predictedDirection: "UP",
      confidence: 0.85,
    });
    expect(result.summaryMd).toBe("A summary");
    expect(result.sentiment).toBe("POSITIVE");
    expect(result.predictedDirection).toBe("UP");
    expect(result.confidence).toBe(0.85);
  });

  it("accepts confidence at boundary 0", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test",
        sentiment: "NEUTRAL",
        predictedDirection: "FLAT",
        confidence: 0,
      }),
    ).not.toThrow();
  });

  it("accepts confidence at boundary 1", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test",
        sentiment: "NEGATIVE",
        predictedDirection: "DOWN",
        confidence: 1,
      }),
    ).not.toThrow();
  });

  it("rejects missing summaryMd (empty string)", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "",
        sentiment: "NEUTRAL",
        predictedDirection: "FLAT",
        confidence: 0.5,
      }),
    ).toThrow("Invalid or missing summaryMd");
  });

  it("rejects missing summaryMd (whitespace only)", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "   ",
        sentiment: "NEUTRAL",
        predictedDirection: "FLAT",
        confidence: 0.5,
      }),
    ).toThrow("Invalid or missing summaryMd");
  });

  it("rejects missing summaryMd (non-string)", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: 123,
        sentiment: "NEUTRAL",
        predictedDirection: "FLAT",
        confidence: 0.5,
      }),
    ).toThrow("Invalid or missing summaryMd");
  });

  it("rejects invalid sentiment", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test",
        sentiment: "BULLISH",
        predictedDirection: "FLAT",
        confidence: 0.5,
      }),
    ).toThrow("Invalid sentiment: BULLISH");
  });

  it("rejects invalid predictedDirection", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test",
        sentiment: "NEUTRAL",
        predictedDirection: "SIDEWAYS",
        confidence: 0.5,
      }),
    ).toThrow("Invalid predictedDirection: SIDEWAYS");
  });

  it("rejects confidence out of range (> 1)", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test",
        sentiment: "NEUTRAL",
        predictedDirection: "DOWN",
        confidence: 1.5,
      }),
    ).toThrow("Invalid confidence: 1.5");
  });

  it("rejects negative confidence", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test",
        sentiment: "NEUTRAL",
        predictedDirection: "FLAT",
        confidence: -0.1,
      }),
    ).toThrow("Invalid confidence: -0.1");
  });

  it("rejects non-number confidence", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test",
        sentiment: "NEUTRAL",
        predictedDirection: "FLAT",
        confidence: "high",
      }),
    ).toThrow("Invalid confidence: high");
  });
});

describe("extractJson", () => {
  it("extracts a JSON object from text", () => {
    const result = extractJson('Some text {"key": "value"} more text');
    expect(result).toEqual({ key: "value" });
  });

  it("extracts nested JSON objects", () => {
    const result = extractJson('{"outer": {"inner": [1, 2, 3]}}');
    expect(result).toEqual({ outer: { inner: [1, 2, 3] } });
  });

  it("extracts valid analysis result JSON", () => {
    const json = `{
      "summaryMd": "The company reported strong earnings.",
      "sentiment": "POSITIVE",
      "predictedDirection": "UP",
      "confidence": 0.92
    }`;
    const result = extractJson(`Here is my analysis:\n${json}`);
    expect(result).toEqual({
      summaryMd: "The company reported strong earnings.",
      sentiment: "POSITIVE",
      predictedDirection: "UP",
      confidence: 0.92,
    });
  });

  it("throws when no JSON object is found", () => {
    expect(() => extractJson("No JSON here at all")).toThrow(
      "No JSON found in Claude response",
    );
  });

  it("throws on invalid JSON", () => {
    expect(() => extractJson("{invalid: json,}")).toThrow();
  });

  it("handles JSON with surrounding text", () => {
    const result = extractJson(
      'The analysis is complete. Here is the result:\n\n{"sentiment": "NEUTRAL", "confidence": 0.5}\n\nLet me know if you need more detail.',
    );
    expect(result).toEqual({ sentiment: "NEUTRAL", confidence: 0.5 });
  });
});
