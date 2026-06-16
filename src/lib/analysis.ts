import { prisma } from "@/lib/prisma";
import { chat, getModelName } from "@/lib/ollama";
import { readPdf, isLocalKey } from "@/lib/storage";

const CURRENT_PROMPT_VERSION = "1.0";

// pdfjs-dist needs browser DOMMatrix in Node.js — polyfill at first use
function polyfillDomMatrix() {
  if (typeof globalThis.DOMMatrix !== "undefined") return;
  globalThis.DOMMatrix = class {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    static fromMatrix() { return new this(); }
    static fromFloat64Array() { return new this(); }
    static fromFloat32Array() { return new this(); }
  } as unknown as typeof globalThis.DOMMatrix;
}

let pdfParsePromise: ReturnType<typeof importPdfParse> | undefined;
async function importPdfParse() {
  polyfillDomMatrix();
  const mod = await import("pdf-parse");
  try {
    mod.PDFParse.setWorker(
      new URL("pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs", `file://${process.cwd()}/node_modules/`).href,
    );
  } catch {
    // Worker config is best-effort
  }
  return mod.PDFParse;
}

function getPDFParse(): ReturnType<typeof importPdfParse> {
  if (!pdfParsePromise) pdfParsePromise = importPdfParse();
  return pdfParsePromise;
}

const SYSTEM_PROMPT = `You are a news summarizer for The Morning Money, a service that provides plain-English summaries of ASX (Australian Securities Exchange) announcements.

Summarize the following ASX company announcement in 2-3 paragraphs. State objectively what was announced and any key details.

Rules:
- Use plain text only. No markdown, no formatting, no headings, no bullet points.
- Do not give opinions, ratings, predictions, or analysis.
- Do not say whether the news is good or bad for the company or its stock.
- Do not speculate on stock price direction.
- Just state the facts: what was announced, by whom, and any relevant dates or figures.`;

export type AnalysisResult = string;

async function fetchPdfBuffer(key: string): Promise<Buffer> {
  if (isLocalKey(key)) return readPdf(key);

  const res = await fetch(key, {
    headers: { "User-Agent": "MorningMoney/1.0" },
  });
  if (!res.ok) throw new Error(`Failed to download PDF: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const PDFParse = await getPDFParse();
  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse(uint8);
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

async function runAnalysis(
  text: string,
  headline: string,
): Promise<string> {
  const truncated = text.length > 6000 ? text.slice(0, 6000) + "\n\n[truncated]" : text;
  const result = await chat({
    system: SYSTEM_PROMPT,
    prompt: `Summarize this ASX announcement with headline "${headline}".\n\nFull text of the announcement:\n\n${truncated}`,
    maxTokens: 500,
  });

  const summary = validateAnalysisResult({ summaryMd: result.text });
  return summary.summaryMd;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateAnalysisResult(
  data: Record<string, unknown>,
): { summaryMd: string } {
  if (typeof data.summaryMd !== "string" || !data.summaryMd.trim()) {
    throw new Error("Invalid or missing summaryMd");
  }
  return { summaryMd: stripMarkdown(data.summaryMd) };
}

export async function analyzeAnnouncement(
  announcementId: string,
): Promise<string> {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });

  if (!announcement) {
    throw new Error(`Announcement not found: ${announcementId}`);
  }

  const existingAnalysis = await prisma.analysis.findUnique({
    where: { announcementId },
  });

  if (existingAnalysis) {
    return existingAnalysis.summaryMd;
  }

  const pdfBuffer = await fetchPdfBuffer(announcement.pdfS3Key);
  const pdfText = await extractPdfText(pdfBuffer);
  const summaryMd = await runAnalysis(pdfText, announcement.headline);

  await prisma.analysis.create({
    data: {
      announcementId,
      summaryMd,
      model: getModelName(),
      promptVersion: CURRENT_PROMPT_VERSION,
    },
  });

  return summaryMd;
}

export async function analyzeUnprocessedAnnouncements(): Promise<{
  processed: number;
  errors: string[];
}> {
  const announcements = await prisma.announcement.findMany({
    where: {
      analysis: null,
    },
    take: 50,
  });

  const errors: string[] = [];
  let processed = 0;

  for (const announcement of announcements) {
    try {
      await analyzeAnnouncement(announcement.id);
      processed++;
    } catch (err) {
      errors.push(`${announcement.headline} (${announcement.asxCode}): ${err}`);
    }
  }

  return { processed, errors };
}
