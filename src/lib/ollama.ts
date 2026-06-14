const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://ollama:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:12b";

export interface ChatOptions {
  system: string;
  prompt: string;
  maxTokens?: number;
}

export interface ChatResult {
  text: string;
  model: string;
}

export function getModelName(): string {
  return OLLAMA_MODEL;
}

export async function chat(options: ChatOptions): Promise<ChatResult> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: options.system },
        { role: "user", content: options.prompt },
      ],
      stream: false,
      options: {
        num_predict: options.maxTokens ?? 2000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return { text: data.message.content, model: OLLAMA_MODEL };
}
