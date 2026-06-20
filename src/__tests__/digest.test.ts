import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/lib/ai", () => ({
  chat: vi.fn(),
  getModelName: vi.fn().mockReturnValue("test-model"),
  hasApiKey: vi.fn().mockReturnValue(false),
}));

vi.mock("@/lib/ollama", () => ({
  chat: vi.fn(),
  getModelName: vi.fn().mockReturnValue("test-model"),
}));

vi.mock("@/lib/smtp", () => ({
  getTransport: vi.fn(),
  getFromAddress: vi.fn().mockReturnValue("Morning Money <daily@localhost>"),
}));

vi.mock("@/lib/storage", () => ({
  savePdf: vi.fn().mockResolvedValue("local://test.pdf"),
  readPdf: vi.fn().mockResolvedValue(Buffer.from("mock pdf")),
  isLocalKey: vi.fn().mockReturnValue(true),
}));

vi.mock("pdf-parse", () => ({
  PDFParse: vi.fn().mockImplementation(() => ({
    getText: vi.fn().mockResolvedValue({
      text: "Mock PDF text content for testing.",
    }),
    destroy: vi.fn(),
  })),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

vi.mock("@/lib/announcements", () => ({
  ingestAllWatchlistedTickers: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import {
  generateDigestRun,
  sendDigest,
  runDailyPipeline,
} from "@/lib/digest";
import { sendDigestEmail } from "@/lib/email";

const { chat } = await import("@/lib/ollama");
const { getTransport } = await import("@/lib/smtp");
const { ingestAllWatchlistedTickers } = await import("@/lib/announcements");

function mockOllamaResponse(summaryMd: string) {
  vi.mocked(chat).mockResolvedValue({
    text: summaryMd,
    model: "test-model",
  });
}

function mockSmtpSuccess() {
  vi.mocked(getTransport).mockReturnValue({
    sendMail: vi.fn().mockResolvedValue(undefined),
    verify: vi.fn(),
  } as never);
}

function mockSmtpFailure() {
  vi.mocked(getTransport).mockReturnValue({
    sendMail: vi.fn().mockRejectedValue(new Error("Failed to send")),
    verify: vi.fn(),
  } as never);
}

describe("generateDigestRun", () => {
  let userId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.digestRun.deleteMany({
      where: { user: { email: "digest-test@tmm.dev" } },
    });
    await prisma.watchlistTicker.deleteMany({
      where: { watchlist: { user: { email: "digest-test@tmm.dev" } } },
    });
    await prisma.watchlist.deleteMany({
      where: { user: { email: "digest-test@tmm.dev" } },
    });
    await prisma.user.deleteMany({
      where: { email: "digest-test@tmm.dev" },
    });

    // Create test user
    const user = await prisma.user.create({
      data: {
        supabaseId: `test-digest-${Date.now()}`,
        email: "digest-test@tmm.dev",
        plan: "PAID",
      },
    });
    userId = user.id;
  });

  it("returns null when user has no watchlist tickers", async () => {
    // User exists but has no watchlists/tickers
    const result = await generateDigestRun(userId, new Date());
    expect(result).toBeNull();
  });

  it("creates empty digest when user has tickers but no announcements TODAY", async () => {
    const watchlist = await prisma.watchlist.create({
      data: { userId, name: "Test" },
    });
    // Use a ticker that has no announcements at all
    await prisma.watchlistTicker.create({
      data: { watchlistId: watchlist.id, asxCode: "ZZZ" },
    });

    const result = await generateDigestRun(userId, new Date());
    expect(result).not.toBeNull();
    expect(result!.analysisCount).toBe(0);
  });

  it("creates empty digest when user has tickers and announcements but none are ANALYSED", async () => {
    const watchlist = await prisma.watchlist.create({
      data: { userId, name: "Test" },
    });
    const code = `UQ${String(Date.now()).slice(-1)}`;
    await prisma.watchlistTicker.create({
      data: { watchlistId: watchlist.id, asxCode: code },
    });

    const today = new Date();
    await prisma.announcement.create({
      data: {
        asxCode: code,
        headline: "Test Unanalysed",
        publishedAt: today,
        pdfS3Key: "test",
        sourceHash: `test-unanalysed-${Date.now()}`,
      },
    });

    const result = await generateDigestRun(userId, today);
    expect(result).not.toBeNull();
    expect(result!.analysisCount).toBe(0);
  });

  it("idempotent: returns null if digest already sent", async () => {
    const today = new Date();
    const todayDate = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
    );

    // Create a digest run that was already sent
    await prisma.digestRun.create({
      data: {
        userId,
        date: todayDate,
        analysisIds: ["analysis-1"],
        sentAt: new Date(),
      },
    });

    const result = await generateDigestRun(userId, today);
    expect(result).toBeNull();
  });
});

describe("sendDigest", () => {
  let digestRunId: string;

  beforeEach(async () => {
    await prisma.digestRun.deleteMany({
      where: { user: { email: "digest-test@tmm.dev" } },
    });
    await prisma.analysis.deleteMany({
      where: {
        announcement: {
          asxCode: "BHP",
          headline: "Test announcement for digest",
        },
      },
    });
    await prisma.announcement.deleteMany({
      where: { headline: "Test announcement for digest" },
    });
    await prisma.watchlistTicker.deleteMany({
      where: { watchlist: { user: { email: "digest-test@tmm.dev" } } },
    });
    await prisma.watchlist.deleteMany({
      where: { user: { email: "digest-test@tmm.dev" } },
    });
    await prisma.user.deleteMany({
      where: { email: "digest-test@tmm.dev" },
    });

    const user = await prisma.user.create({
      data: {
        supabaseId: `test-send-${Date.now()}`,
        email: "digest-test@tmm.dev",
        plan: "PAID",
      },
    });

    const announcement = await prisma.announcement.create({
      data: {
        asxCode: "BHP",
        headline: "Test announcement for digest",
        publishedAt: new Date(),
        pdfS3Key: "test-key",
        sourceHash: `test-hash-${Date.now()}`,
      },
    });

    const analysis = await prisma.analysis.create({
      data: {
        announcementId: announcement.id,
        summaryMd: "This is a test analysis summary.",
        model: "test-model",
        promptVersion: "1.0",
      },
    });

    const dr = await prisma.digestRun.create({
      data: {
        userId: user.id,
        date: new Date(),
        analysisIds: [analysis.id],
      },
    });
    digestRunId = dr.id;
  });

  it("sends email and marks digest as sent", async () => {
    mockSmtpSuccess();

    const ok = await sendDigest(digestRunId);
    expect(ok).toBe(true);

    // Verify it was marked as sent
    const updated = await prisma.digestRun.findUnique({
      where: { id: digestRunId },
    });
    expect(updated?.sentAt).not.toBeNull();
  });

  it("returns false when SMTP fails", async () => {
    mockSmtpFailure();

    const ok = await sendDigest(digestRunId);
    expect(ok).toBe(false);

    // Verify it was NOT marked as sent
    const updated = await prisma.digestRun.findUnique({
      where: { id: digestRunId },
    });
    expect(updated?.sentAt).toBeNull();
  });

  it("returns false for non-existent digest run", async () => {
    const ok = await sendDigest("non-existent-id");
    expect(ok).toBe(false);
  });

  it("returns false if digest was already sent", async () => {
    mockSmtpSuccess();

    // Send first time
    await sendDigest(digestRunId);

    // Try to send again
    mockSmtpSuccess();
    const ok = await sendDigest(digestRunId);
    expect(ok).toBe(false);
  });
});

describe("runDailyPipeline", () => {
  beforeEach(async () => {
    await prisma.digestRun.deleteMany({
      where: { user: { email: "digest-test@tmm.dev" } },
    });
    await prisma.watchlistTicker.deleteMany({
      where: { watchlist: { user: { email: "digest-test@tmm.dev" } } },
    });
    await prisma.watchlist.deleteMany({
      where: { user: { email: "digest-test@tmm.dev" } },
    });
    await prisma.user.deleteMany({
      where: { email: "digest-test@tmm.dev" },
    });
    vi.mocked(getTransport).mockReset();
    vi.mocked(getTransport).mockReturnValue(undefined as never);
  });

  it("generates digest runs even when no announcements are fetched", async () => {
    // Freeze time to a Monday so the pipeline doesn't skip as a weekend
    const monday = new Date("2026-06-08T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(monday);

    const user = await prisma.user.create({
      data: {
        supabaseId: `test-pipeline-${Date.now()}`,
        email: "digest-test@tmm.dev",
        plan: "PAID",
      },
    });

    const watchlist = await prisma.watchlist.create({
      data: { userId: user.id, name: "Test" },
    });
    await prisma.watchlistTicker.create({
      data: { watchlistId: watchlist.id, asxCode: "ZZZ" },
    });

    vi.mocked(ingestAllWatchlistedTickers).mockResolvedValue({});

    const result = await runDailyPipeline();

    expect(result.announcementsFetched).toEqual({});
    expect(result.analyzed).toBe(0);
    expect(result.digestsGenerated).toBeGreaterThanOrEqual(1);
    expect(result.emailsSent).toBe(0);
  });
});
