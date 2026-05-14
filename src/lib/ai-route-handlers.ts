/**
 * Server-side AI route handlers for `/api/ai/$action`.
 * Claude is only called when `ANTHROPIC_API_KEY` is set (never expose to the browser).
 *
 * Pro gate: default `subscriptionTier === "pro"` in the JSON body.
 * Local/dev without billing: set `PACKLOG_AI_ALLOW_PARSE_TRIP=1` to allow **parse-trip only**
 * without Pro (still requires API key).
 * `PACKLOG_AI_ALLOW_VISION_IMPORT=1` — same for **import-screenshot** (Pro 或该开关 + API key)。
 */

import {
  anthropicMessagesText,
  anthropicMessagesWithParts,
  parseJsonArrayFromModelText,
  parseJsonObjectFromModelText,
} from "@/lib/anthropic-messages";

export type AiAction =
  | "parse-trip"
  | "generate-checklist"
  | "import-screenshot"
  | "suggest-gear"
  | "post-trip-review"
  | "estimate-weight";

const ALLOWED: Set<string> = new Set([
  "parse-trip",
  "generate-checklist",
  "import-screenshot",
  "suggest-gear",
  "post-trip-review",
  "estimate-weight",
]);

const PARSE_TRIP_SYSTEM = `你是一个出行规划解析器。用户会用自然语言描述一次出行计划。
请从中提取以下信息，以 JSON 格式返回：

{
  "destination": { "country": "日本", "city": "屋久岛", "country_en": "Japan", "city_en": "Yakushima" },
  "title": "屋久岛 · 5天",
  "start_date": "2026-06-01",
  "end_date": "2026-06-05",
  "duration_days": 5,
  "scenes": ["通用", "山地/高山"],
  "climate_note": "6月 20-28°C 多雨",
  "special_notes": ["有3晚露营", "从福冈出发"]
}

只返回 JSON，不要其他文字。如果某个字段无法从用户输入中推断，设为 null。
日期用 YYYY-MM-DD。scenes 从以下选项中选择零个或多个：通用、冬季/城市、夏季/海滩、越野跑、山地/高山、沙漠、滑雪/单板、潜水/浮潜、远程办公。`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isPro(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const tier = (body as { subscriptionTier?: string }).subscriptionTier;
  return tier === "pro";
}

function parseTripBypassPro(): boolean {
  return (
    typeof process !== "undefined" &&
    (process.env.PACKLOG_AI_ALLOW_PARSE_TRIP === "1" ||
      process.env.PACKLOG_AI_ALLOW_PARSE_TRIP === "true")
  );
}

function visionImportBypassPro(): boolean {
  return (
    typeof process !== "undefined" &&
    (process.env.PACKLOG_AI_ALLOW_VISION_IMPORT === "1" ||
      process.env.PACKLOG_AI_ALLOW_VISION_IMPORT === "true")
  );
}

function tierAllowsAction(action: string, body: unknown): boolean {
  if (isPro(body)) return true;
  if (action === "parse-trip" && parseTripBypassPro()) return true;
  if (action === "import-screenshot" && visionImportBypassPro()) return true;
  return false;
}

function anthropicKey(): string {
  if (typeof process === "undefined" || !process.env?.ANTHROPIC_API_KEY) return "";
  return process.env.ANTHROPIC_API_KEY;
}

function defaultModel(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
}

async function handleParseTrip(body: unknown): Promise<Response> {
  const text =
    body && typeof body === "object" && "text" in body
      ? String((body as { text?: unknown }).text ?? "").trim()
      : "";
  if (!text) {
    return json({ ok: false, code: "MISSING_TEXT", message: "缺少行程描述 text 字段。" }, 400);
  }

  const key = anthropicKey();
  if (!key) {
    return json({
      ok: false,
      code: "AI_NOT_CONFIGURED",
      message: "服务器未配置 ANTHROPIC_API_KEY。",
    });
  }

  const model = defaultModel();
  try {
    const raw = await anthropicMessagesText({
      apiKey: key,
      model,
      system: PARSE_TRIP_SYSTEM,
      user: `用户描述如下，请只输出 JSON：\n\n${text}`,
      maxTokens: 2048,
      temperature: 0.2,
    });
    const parsed = parseJsonObjectFromModelText(raw);
    return json({ ok: true, parsed, model });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(
      {
        ok: false,
        code: "PARSE_FAILED",
        message: msg,
      },
      502,
    );
  }
}

const IMPORT_SCREENSHOT_SYSTEM = `你是装备清单 OCR。用户上传一张装备/行李清单截图。
请识别图中物品，返回 **JSON 数组**（不要对象包裹），每项：
{
  "name": "中文名优先",
  "brand": "品牌或 null",
  "model": "型号或 null",
  "weight_g": 克数整数或 null,
  "quantity": 数量默认 1,
  "category": "apparel|footwear|tech|optic|health|doc|misc 之一（footwear 可归 apparel）",
  "note": "图中可见的补充说明或 null"
}
只返回 JSON 数组，不要其他文字。若不是装备清单则返回 []。`;

async function handleImportScreenshot(body: unknown): Promise<Response> {
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const b64 = typeof o.imageBase64 === "string" ? o.imageBase64.trim() : "";
  const mediaTypeRaw = String(o.mediaType ?? "image/jpeg").toLowerCase();
  const allowedMt = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
  const mediaType = (allowedMt as readonly string[]).includes(mediaTypeRaw)
    ? (mediaTypeRaw as (typeof allowedMt)[number])
    : "image/jpeg";

  if (!b64) {
    return json({ ok: false, code: "MISSING_IMAGE", message: "缺少 imageBase64。" }, 400);
  }
  if (b64.length > 6_000_000) {
    return json({ ok: false, code: "IMAGE_TOO_LARGE", message: "图片过大。" }, 413);
  }

  const key = anthropicKey();
  if (!key) {
    return json({
      ok: false,
      code: "AI_NOT_CONFIGURED",
      message: "服务器未配置 ANTHROPIC_API_KEY。",
    });
  }

  const model = defaultModel();
  try {
    const raw = await anthropicMessagesWithParts({
      apiKey: key,
      model,
      system: IMPORT_SCREENSHOT_SYSTEM,
      parts: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: b64 },
        },
        {
          type: "text",
          text: "识别这张图片中的装备清单，只输出 JSON 数组。",
        },
      ],
      maxTokens: 4096,
      temperature: 0.2,
    });
    const items = parseJsonArrayFromModelText(raw);
    return json({ ok: true, items, model });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, code: "PARSE_FAILED", message: msg }, 502);
  }
}

export async function handleAiAction(action: string, body: unknown): Promise<Response> {
  if (!ALLOWED.has(action)) {
    return json({ ok: false, error: "unknown_action" }, 404);
  }

  if (!tierAllowsAction(action, body)) {
    return json({
      ok: false,
      code: "PRO_REQUIRED",
      message:
        "这是 Pro 功能。升级后可用 AI 解析行程、识别截图等。本地可设 PACKLOG_AI_ALLOW_PARSE_TRIP=1（行程解析）或 PACKLOG_AI_ALLOW_VISION_IMPORT=1（截图导入）。",
    });
  }

  const key = anthropicKey();
  if (!key) {
    return json({
      ok: false,
      code: "AI_NOT_CONFIGURED",
      message: "AI 路由已接通，但服务器未配置 ANTHROPIC_API_KEY。请在部署环境设置密钥后重试。",
      action,
    });
  }

  if (action === "parse-trip") {
    return handleParseTrip(body);
  }

  if (action === "import-screenshot") {
    return handleImportScreenshot(body);
  }

  void key;
  return json({
    ok: false,
    code: "NOT_IMPLEMENTED",
    message: "该 AI action 尚未实现；请参考 PACKLOG-AI.md。",
    action,
  });
}
