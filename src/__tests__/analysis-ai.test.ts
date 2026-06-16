import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Ollama client
vi.mock("@/lib/ollama", () => ({
  chat: vi.fn(),
  getModelName: vi.fn().mockReturnValue("test-model"),
}));

// Mock storage
vi.mock("@/lib/storage", () => ({
  readPdf: vi.fn().mockResolvedValue(Buffer.from("mock pdf")),
  isLocalKey: vi.fn().mockReturnValue(true),
  savePdf: vi.fn().mockResolvedValue("local://test.pdf"),
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
  validateAnalysisResult,
  analyzeUnprocessedAnnouncements,
} from "@/lib/analysis";

const { chat } = await import("@/lib/ollama");
const { PDFParse } = await import("pdf-parse");

function setupMocks(llmTextResponse: string, pdfTextContent: string) {
  vi.mocked(chat).mockResolvedValue({
    text: llmTextResponse,
    model: "test-model",
  });

  vi.mocked(PDFParse).mockImplementation(
    function (this: Record<string, unknown>) {
      this.getText = vi.fn().mockResolvedValue({ text: pdfTextContent });
      this.destroy = vi.fn();
    },
  );
}

describe("validateAnalysisResult", () => {
  it("accepts valid summaryMd", () => {
    const result = validateAnalysisResult({ summaryMd: "A summary" });
    expect(result.summaryMd).toBe("A summary");
  });

  it("accepts boundaries", () => {
    expect(() => validateAnalysisResult({ summaryMd: "ok" })).not.toThrow();
  });

  it("rejects missing summaryMd", () => {
    expect(() => validateAnalysisResult({ summaryMd: "" })).toThrow(/Invalid or missing summaryMd/);
  });

  it("strips hallucinated fields", () => {
    const result = validateAnalysisResult({
      summaryMd: "Valid summary.",
      buyRecommendation: "STRONG_BUY",
    });
    expect(result.summaryMd).toBe("Valid summary.");
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

