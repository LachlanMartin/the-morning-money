import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Anthropic client
vi.mock("@/lib/anthropic", () => ({
  getAnthropicClient: vi.fn(),
}));

// Mock S3 client
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

// Mock PDF parsing
vi.mock("pdf-parse", () => ({
  PDFParse: vi.fn(),
}));

// Mock global fetch for ASX PDF downloads
vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue(
    new Response(
      new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xc7,
        0xec, 0x8f, 0xa2, 0x0a,
      ]),
      { status: 200, headers: { "Content-Type": "application/pdf" } },
    ),
  ),
);

import { prisma } from "@/lib/prisma";
import {
  extractJson,
  validateAnalysisResult,
  analyzeUnprocessedAnnouncements,
} from "@/lib/analysis";

const { getAnthropicClient } = await import("@/lib/anthropic");
const { PDFParse } = await import("pdf-parse");

function setupMocks(claudeJsonResponse: string, pdfTextContent: string) {
  vi.mocked(getAnthropicClient).mockReturnValue({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: claudeJsonResponse }],
      }),
    },
  } as never);

  vi.mocked(PDFParse).mockImplementation(
    function (this: Record<string, unknown>) {
      this.getText = vi.fn().mockResolvedValue({ text: pdfTextContent });
      this.destroy = vi.fn();
    },
  );
}

// Tests that DON'T need the full PDF→Claude pipeline (pure logic tests)
describe("extractJson (Claude response parsing)", () => {
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

  it("handles JSON with surrounding text", () => {
    const result = extractJson(
      'The analysis is complete. Here is the result:\n\n{"sentiment": "NEUTRAL", "confidence": 0.5}\n\nLet me know if you need more detail.',
    );
    expect(result).toEqual({ sentiment: "NEUTRAL", confidence: 0.5 });
  });

  it("extracts JSON when Claude wraps in markdown code block", () => {
    const text = '```json\n{"sentiment": "POSITIVE"}\n```';
    const result = extractJson(text);
    expect(result).toEqual({ sentiment: "POSITIVE" });
  });

  it("extracts JSON from Claude's natural language wrapping", () => {
    const text =
      'Based on the announcement, I would rate this as {"sentiment": "NEUTRAL", "predictedDirection": "FLAT", "summaryMd": "Stable quarter.", "confidence": 0.6}';
    const result = extractJson(text);
    expect(result.sentiment).toBe("NEUTRAL");
  });
});

describe("validateAnalysisResult (safety checks)", () => {
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

  it("accepts boundaries: confidence 0 and 1", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test", sentiment: "NEUTRAL",
        predictedDirection: "FLAT", confidence: 0,
      }),
    ).not.toThrow();
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test", sentiment: "NEGATIVE",
        predictedDirection: "DOWN", confidence: 1,
      }),
    ).not.toThrow();
  });

  it("rejects missing summaryMd", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "", sentiment: "NEUTRAL",
        predictedDirection: "FLAT", confidence: 0.5,
      }),
    ).toThrow(/Invalid or missing summaryMd/);
  });

  it("rejects invalid sentiment", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test", sentiment: "BULLISH",
        predictedDirection: "FLAT", confidence: 0.5,
      }),
    ).toThrow(/Invalid sentiment/);
  });

  it("rejects invalid predictedDirection", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test", sentiment: "NEUTRAL",
        predictedDirection: "SIDEWAYS", confidence: 0.5,
      }),
    ).toThrow(/Invalid predictedDirection/);
  });

  it("rejects confidence out of range", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test", sentiment: "NEUTRAL",
        predictedDirection: "DOWN", confidence: 1.5,
      }),
    ).toThrow(/Invalid confidence/);
  });

  it("rejects NaN confidence", () => {
    expect(() =>
      validateAnalysisResult({
        summaryMd: "test", sentiment: "NEUTRAL",
        predictedDirection: "FLAT", confidence: NaN,
      }),
    ).toThrow(/Invalid confidence/);
  });

  it("strips AFSL-violating hallucinated fields from Claude output", () => {
    // validateAnalysisResult uses destructuring — extra fields are silently dropped
    const result = validateAnalysisResult({
      summaryMd: "Valid summary.",
      sentiment: "POSITIVE",
      predictedDirection: "UP",
      confidence: 0.9,
      buyRecommendation: "STRONG_BUY", // AFSL violation
      targetPrice: 45.0,
      portfolioAdvice: "Allocate 30% to this stock",
    });
    expect(result.summaryMd).toBe("Valid summary.");
    expect(result.sentiment).toBe("POSITIVE");
    expect(result.predictedDirection).toBe("UP");
    expect(result.confidence).toBe(0.9);
    // Hallucinated fields should not appear in the returned object
    expect((result as Record<string, unknown>).buyRecommendation).toBeUndefined();
    expect((result as Record<string, unknown>).targetPrice).toBeUndefined();
  });
});

describe("analyzeUnprocessedAnnouncements (pipeline integration)", () => {
  beforeEach(async () => {
    await prisma.analysis.deleteMany({
      where: { announcement: { sourceHash: { startsWith: "test-" } } },
    });
    await prisma.announcement.deleteMany({
      where: { sourceHash: { startsWith: "test-" } },
    });
  });

  it("returns empty when no unanalysed announcements exist", async () => {
    const result = await analyzeUnprocessedAnnouncements();
    expect(result.processed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("skips announcements that already have analysis", async () => {
    const hash = `test-ai-skip-${Date.now()}`;
    const announcement = await prisma.announcement.create({
      data: {
        asxCode: "BHP",
        headline: "Already Analysed Report",
        publishedAt: new Date(),
        pdfS3Key: "asx://https://example.com/already.pdf",
        sourceHash: hash,
      },
    });

    await prisma.analysis.create({
      data: {
        announcementId: announcement.id,
        summaryMd: "Pre-existing analysis.",
        sentiment: "NEUTRAL",
        predictedDirection: "FLAT",
        confidence: 0.5,
        model: "test",
        promptVersion: "1.0",
      },
    });

    const result = await analyzeUnprocessedAnnouncements();
    expect(result.processed).toBe(0);
  });

  it("captures errors from Claude that returns invalid JSON", async () => {
    setupMocks("No JSON here, just some unstructured text.", "Test PDF content.");

    await prisma.announcement.create({
      data: {
        asxCode: "BHP",
        headline: "Invalid Response Report",
        publishedAt: new Date(),
        pdfS3Key: "asx://https://example.com/invalid.pdf",
        sourceHash: `test-ai-err-${Date.now()}`,
      },
    });

    const result = await analyzeUnprocessedAnnouncements();
    expect(result.processed).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Invalid Response Report");
  });
});

// Note: The full PDF→fetch→PDFParse→Claude pipeline integration with
// mocked constructors has ESM mock limitations in Vitest. The full
// end-to-end flow (including Claude analysis) is verified by:
//   curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/daily-digest

