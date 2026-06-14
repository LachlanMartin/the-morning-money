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

const SYSTEM_PROMPT = `You are a financial news analyst at The Morning Money, a service that provides plain-English summaries of ASX (Australian Securities Exchange) announcements.

## Your role
- Analyse ASX company announcements and produce clear, factual summaries.
- Determine the sentiment (positive, negative, or neutral) of the announcement.
- Predict the likely short-term direction of the company's stock.
- Provide a confidence level for your assessment.

## Constraints (Australian financial services law)
You MUST NOT:
- Give personal financial advice or recommendations.
- Say "you should buy" or "you should sell" or "this is a good investment".
- Consider any individual's portfolio, risk tolerance, or financial goals.
- Make guarantees about future performance.

You MAY:
- Describe what the announcement says in plain language.
- State whether the news is generally positive, negative, or neutral for the company.
- Indicate what the market might reasonably infer from the information.
- Include relevant context about the company's industry or sector.

## Output format
Respond with a JSON object containing:
{
  "summaryMd": "A 2-3 paragraph plain-English summary in markdown format",
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "predictedDirection": "UP" | "FLAT" | "DOWN",
  "confidence": 0.75
}

- sentiment: The overall tone of the announcement for the company
- predictedDirection: Expected short-term stock price direction based on the announcement
- confidence: A value between 0 and 1 indicating how confident you are in your assessment
  - 0.9+: Very clear, unambiguous announcement with clear implications
  - 0.7-0.9: Reasonably clear implications
  - 0.5-0.7: Mixed signals or ambiguous announcement
  - Below 0.5: Highly ambiguous or insufficient information
- summaryMd: 2-3 paragraphs that explain what was announced and why it matters, written in neutral journalistic style`;

export type AnalysisResult = {
  summaryMd: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  predictedDirection: "UP" | "FLAT" | "DOWN";
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
  const result = await chat({
    system: SYSTEM_PROMPT,
    prompt: `Analyse this ASX announcement with headline "${headline}".\n\nFull text of the announcement:\n\n${text}`,
    maxTokens: 2000,
  });

  const json = extractJson(result.text);
  return validateAnalysisResult(json);
}

export function extractJson(text: string): Record<string, unknown> {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in Claude response");
  return JSON.parse(match[0]);
}

export function validateAnalysisResult(
  data: Record<string, unknown>,
): AnalysisResult {
  const validSentiments = ["POSITIVE", "NEUTRAL", "NEGATIVE"];
  const validDirections = ["UP", "FLAT", "DOWN"];

  if (typeof data.summaryMd !== "string" || !data.summaryMd.trim()) {
    throw new Error("Invalid or missing summaryMd");
  }
  if (!validSentiments.includes(data.sentiment as string)) {
    throw new Error(`Invalid sentiment: ${data.sentiment}`);
  }
  if (!validDirections.includes(data.predictedDirection as string)) {
    throw new Error(`Invalid predictedDirection: ${data.predictedDirection}`);
  }
  if (
    typeof data.confidence !== "number" ||
    Number.isNaN(data.confidence) ||
    data.confidence < 0 ||
    data.confidence > 1
  ) {
    throw new Error(`Invalid confidence: ${data.confidence}`);
  }

  return {
    summaryMd: data.summaryMd,
    sentiment: data.sentiment as AnalysisResult["sentiment"],
    predictedDirection:
      data.predictedDirection as AnalysisResult["predictedDirection"],
    confidence: data.confidence,
  };
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
      sentiment: existingAnalysis.sentiment,
      predictedDirection: existingAnalysis.predictedDirection,
      confidence: existingAnalysis.confidence,
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
