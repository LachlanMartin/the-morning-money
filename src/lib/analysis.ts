import { prisma } from "@/lib/prisma";
import { getAnthropicClient } from "@/lib/anthropic";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { PDFParse } from "pdf-parse";

const CURRENT_PROMPT_VERSION = "1.0";
const MODEL = "claude-sonnet-4-20250514";

// Configure PDF.js worker for Node.js runtime
try {
  PDFParse.setWorker(
    new URL("pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs", `file://${process.cwd()}/node_modules/`).href,
  );
} catch {
  // Worker config is best-effort; PDFParse will use fallback
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

function getS3Client(): S3Client | null {
  if (
    !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY
  ) {
    return null;
  }
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

function isAsxReference(key: string): boolean {
  return key.startsWith("asx://");
}

function asxUrlFromReference(key: string): string {
  return key.replace("asx://", "");
}

async function downloadPdfFromUrl(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "MorningMoney/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Failed to download PDF: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function downloadPdfFromS3(key: string): Promise<Buffer> {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("AWS_S3_BUCKET not set");

  const s3 = getS3Client();
  if (!s3) throw new Error("S3 not configured");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const response = await s3.send(command);
  const body = await response.Body?.transformToByteArray();
  if (!body) throw new Error("Empty PDF from S3");

  return Buffer.from(body);
}

async function fetchPdfBuffer(pdfS3Key: string): Promise<Buffer> {
  if (isAsxReference(pdfS3Key)) {
    return downloadPdfFromUrl(asxUrlFromReference(pdfS3Key));
  }
  return downloadPdfFromS3(pdfS3Key);
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse(uint8);
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

async function callClaude(
  text: string,
  headline: string,
): Promise<AnalysisResult> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyse this ASX announcement with headline "${headline}".\n\nFull text of the announcement:\n\n${text}`,
          },
        ],
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const json = extractJson(block.text);
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
  const result = await callClaude(pdfText, announcement.headline);

  await prisma.analysis.create({
    data: {
      announcementId,
      summaryMd: result.summaryMd,
      sentiment: result.sentiment,
      predictedDirection: result.predictedDirection,
      confidence: result.confidence,
      model: MODEL,
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
