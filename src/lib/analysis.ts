import { prisma } from "@/lib/prisma";
import { chat, getModelName } from "@/lib/ollama";
import { readPdf, isLocalKey } from "@/lib/storage";

const CURRENT_PROMPT_VERSION = "2.0";

const ANALYSIS_COMPLEXITY = process.env.ANALYSIS_COMPLEXITY || "plain";

const COMPLEXITY_GUIDES: Record<string, string> = {
  plain: `You are writing for readers with no financial background. Use simple, everyday language. Explain financial terms or acronyms the first time they appear (e.g., "earnings per share (EPS), which measures profit divided by total shares"). Focus on practical, real-world implications. Avoid jargon.`,
  informed: `You are writing for readers with basic investing knowledge. Use standard financial terminology (EPS, dividend, ASX, market cap, P/E ratio). Assume familiarity with common market concepts.`,
  professional: `You are writing for finance professionals. Use precise technical terminology (EBITDA, CAGR, DCF, EV/EBITDA, accretion/dilution, basis points). Do not simplify or explain standard financial concepts.`,
};

function buildSystemPrompt(complexity: string): string {
  const guide = COMPLEXITY_GUIDES[complexity] ?? COMPLEXITY_GUIDES.plain;

  return `You are a news analyst for The Morning Money, a service that helps investors understand ASX (Australian Securities Exchange) announcements and what they mean for shareholders.

${guide}

For each announcement, provide a summary with two clearly separated sections. Use the exact section headers shown:

WHAT HAPPENED
[1-2 paragraphs: State what was announced, by whom, and the key facts — dates, figures, parties involved. Be concise and objective.]

STAKEHOLDER IMPACT
[2-3 paragraphs: Explain why this matters to shareholders. Cover whichever of the following are relevant:
- Direct financial impact: earnings, dividends, capital structure, dilution
- Strategic significance: new markets, products, acquisitions, partnerships, competitive position
- Governance and risk: board changes, regulatory actions, legal matters, compliance issues

Focus on the practical implications for shareholders. Do not give buy/sell/hold advice.]

Rules:
- Use plain text only. No markdown, no formatting, no bullet points.
- Do not give investment advice or recommend buying, selling, or holding.
- Do not predict stock price direction or magnitude.`;
}

const SYSTEM_PROMPT = buildSystemPrompt(ANALYSIS_COMPLEXITY);

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
    prompt: `Analyze this ASX announcement with headline "${headline}" using the WHAT HAPPENED / STAKEHOLDER IMPACT format.\n\nFull text of the announcement:\n\n${truncated}`,
    maxTokens: 700,
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
      complexity: ANALYSIS_COMPLEXITY,
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
