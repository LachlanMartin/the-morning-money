import { prisma } from "@/lib/prisma";
import { chat as anthropicChat, getModelName as anthropicModelName, hasApiKey } from "@/lib/ai";
import { chat as ollamaChat, getModelName as ollamaModelName } from "@/lib/ollama";
import { Sentiment, Direction } from "@/generated/prisma/client";
import { readPdf, isLocalKey } from "@/lib/storage";

const CURRENT_PROMPT_VERSION = "3.0";

const ANALYSIS_COMPLEXITY = process.env.ANALYSIS_COMPLEXITY || "plain";

const COMPLEXITY_GUIDES: Record<string, string> = {
  plain: `You are writing for readers with no financial background. Use simple, everyday language. Explain financial terms or acronyms the first time they appear (e.g., "earnings per share (EPS), which measures profit divided by total shares"). Focus on practical, real-world implications. Avoid jargon.`,
  informed: `You are writing for readers with basic investing knowledge. Use standard financial terminology (EPS, dividend, ASX, market cap, P/E ratio). Assume familiarity with common market concepts.`,
  professional: `You are writing for finance professionals. Use precise technical terminology (EBITDA, CAGR, DCF, EV/EBITDA, accretion/dilution, basis points). Do not simplify or explain standard financial concepts.`,
};

function buildSystemPrompt(complexity: string): string {
  const guide = COMPLEXITY_GUIDES[complexity] ?? COMPLEXITY_GUIDES.plain;

  return `You are a news analyst for The Morning Money, a service that helps investors understand ASX (Australian Securities Exchange) announcements. Your tone is sharp, conversational, and entertaining — like a well-read friend breaking down business news at the pub. Use analogies, be direct, call out what matters. If something is bullish, say why. If it's bearish, don't sugarcoat. Avoid bureaucratic corporate-speak.

${guide}

For each announcement, write a concise summary (no more than 3 paragraphs) in markdown format.

Start with a level-2 heading (##) that captures the announcement's essence — you can be creative. Examples of good headings:
- ## BHP cashes in on China's insatiable hunger
- ## CBA rewards shareholders but the spotlight's on expenses
- ## Wesfarmers spins the wheel on another acquisition

Rules:
- Markdown only: use ##, **bold**, _italic_, \`code\` as needed.
- Do not exceed 3 paragraphs after the heading.
- Do not give investment advice or recommend buying, selling, or holding.
- This is general information and sentiment only.

After the summary, append a JSON assessment on its own line:
{"sentiment":"POSITIVE","predictedDirection":"UP","confidence":0.75}

Sentiment must be one of: POSITIVE, NEUTRAL, NEGATIVE.
Predicted direction must be one of: UP, FLAT, DOWN.
Confidence must be a number between 0.0 and 1.0.`;
}

const SYSTEM_PROMPT = buildSystemPrompt(ANALYSIS_COMPLEXITY);

function getChat() {
  return hasApiKey() ? anthropicChat : ollamaChat;
}

function getModelName() {
  return hasApiKey() ? anthropicModelName() : ollamaModelName();
}

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

export type AnalysisResult = {
  summaryMd: string;
  sentiment: Sentiment;
  predictedDirection: Direction;
  confidence: number;
};

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
): Promise<AnalysisResult> {
  const truncated = text.length > 6000 ? text.slice(0, 6000) + "\n\n[truncated]" : text;
  const result = await getChat()({
    system: SYSTEM_PROMPT,
    prompt: `Analyze this ASX announcement with headline "${headline}".\n\nFull text of the announcement:\n\n${truncated}`,
    maxTokens: 1000,
  });

  return validateAnalysisResult(result.text);
}

function extractJsonBlock(text: string): { json: Record<string, unknown>; beforeJson: string } {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON block found in LLM response");
  const json = JSON.parse(match[0]);
  const beforeJson = text.slice(0, match.index).trim();
  return { json, beforeJson };
}

export function validateAnalysisResult(
  raw: string,
): AnalysisResult {
  const { json, beforeJson } = extractJsonBlock(raw);

  if (!beforeJson) {
    throw new Error("Missing summary text before JSON block");
  }
  const summaryMd = beforeJson;

  if (!["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(json.sentiment as string)) {
    throw new Error(`Invalid sentiment: ${json.sentiment}`);
  }
  const sentiment = json.sentiment as Sentiment;

  if (!["UP", "FLAT", "DOWN"].includes(json.predictedDirection as string)) {
    throw new Error(`Invalid predictedDirection: ${json.predictedDirection}`);
  }
  const predictedDirection = json.predictedDirection as Direction;

  if (typeof json.confidence !== "number" || json.confidence < 0 || json.confidence > 1) {
    throw new Error(`Invalid confidence: ${json.confidence}`);
  }
  const confidence = json.confidence;

  return { summaryMd, sentiment, predictedDirection, confidence };
}

export async function analyzeAnnouncement(
  announcementId: string,
): Promise<AnalysisResult> {
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
    return {
      summaryMd: existingAnalysis.summaryMd,
      sentiment: existingAnalysis.sentiment ?? "NEUTRAL",
      predictedDirection: existingAnalysis.predictedDirection ?? "FLAT",
      confidence: existingAnalysis.confidence ?? 0,
    };
  }

  const pdfBuffer = await fetchPdfBuffer(announcement.pdfS3Key);
  const pdfText = await extractPdfText(pdfBuffer);
  const result = await runAnalysis(pdfText, announcement.headline);

  await prisma.analysis.create({
    data: {
      announcementId,
      summaryMd: result.summaryMd,
      sentiment: result.sentiment,
      predictedDirection: result.predictedDirection,
      confidence: result.confidence,
      model: getModelName(),
      promptVersion: CURRENT_PROMPT_VERSION,
      complexity: ANALYSIS_COMPLEXITY,
    },
  });

  return result;
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
