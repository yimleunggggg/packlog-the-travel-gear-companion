/**
 * Minimal Anthropic Messages API client (server-side only).
 * @see https://docs.anthropic.com/en/api/messages
 */

const ANTHROPIC_VERSION = "2023-06-01";

export type AnthropicUserContentPart =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        data: string;
      };
    };

async function anthropicMessagesRaw(params: {
  apiKey: string;
  model: string;
  system: string;
  userContent: string | AnthropicUserContentPart[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const { apiKey, model, system, userContent, maxTokens = 2048, temperature = 0.2 } = params;

  const content =
    typeof userContent === "string"
      ? userContent
      : (userContent as unknown as Record<string, unknown>[]);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content }],
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`anthropic_http_${res.status}: ${raw.slice(0, 800)}`);
  }

  const data = JSON.parse(raw) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const block = data.content?.find((c) => c.type === "text" && typeof c.text === "string");
  return block?.text ?? "";
}

export async function anthropicMessagesText(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const { user, ...rest } = params;
  return anthropicMessagesRaw({ ...rest, userContent: user });
}

/** Vision / multimodal user turn（截图导入等）。 */
export async function anthropicMessagesWithParts(params: {
  apiKey: string;
  model: string;
  system: string;
  parts: AnthropicUserContentPart[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const { parts, ...rest } = params;
  return anthropicMessagesRaw({ ...rest, userContent: parts });
}

/** Strip optional ```json fences and parse JSON object. */
export function parseJsonObjectFromModelText(text: string): unknown {
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (fence) s = fence[1]!.trim();
  return JSON.parse(s) as unknown;
}

/** Parse JSON array from model (screenshot import). */
export function parseJsonArrayFromModelText(text: string): unknown[] {
  let s = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(s);
  if (fence) s = fence[1]!.trim();
  const v = JSON.parse(s) as unknown;
  return Array.isArray(v) ? v : [];
}
