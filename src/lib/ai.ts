import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

export interface ChatOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface ChatResult {
  text: string;
  model: string;
}

export async function chat(options: ChatOptions): Promise<ChatResult> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: options.maxTokens ?? 1000,
    system: options.system,
    messages: [{ role: "user", content: options.prompt }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  return { text, model: MODEL };
}

export function getModelName(): string {
  return MODEL;
}

export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
