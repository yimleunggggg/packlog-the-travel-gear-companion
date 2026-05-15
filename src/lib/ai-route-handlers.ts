/**
 * Server-side AI route handlers for `/api/ai/$action`.
 * Claude is only called when `ANTHROPIC_API_KEY` is set (never expose to the browser).
 *
 * Pro gate: default `subscriptionTier === "pro"` in the JSON body.
 * Local/dev without billing: set `PACKLOG_AI_ALLOW_PARSE_TRIP=1` to allow **parse-trip only**
 * without Pro (still requires API key).
 * `PACKLOG_AI_ALLOW_VISION_IMPORT=1` — same for **import-screenshot** (Pro 或该开关 + API key)。
 * `PACKLOG_AI_ALLOW_IMPORT_URL=1` — **import-url**（从链接抓取正文 + 提取清单）。
 */

import {
  anthropicMessagesText,
  anthropicMessagesWithParts,
  parseJsonArrayFromModelText,
  parseJsonObjectFromModelText,
} from "@/lib/anthropic-messages";
import { htmlToPlainText } from "@/lib/html-to-text";
import type { Item } from "@/lib/packlog-data";

export type AiAction =
  | "parse-trip"
  | "generate-checklist"
  | "import-screenshot"
  | "import-url"
  | "suggest-gear"
  | "post-trip-review"
  | "estimate-weight";

const ALLOWED: Set<string> = new Set([
  "parse-trip",
  "generate-checklist",
  "import-screenshot",
  "import-url",
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

function importUrlBypassPro(): boolean {
  return (
    typeof process !== "undefined" &&
    (process.env.PACKLOG_AI_ALLOW_IMPORT_URL === "1" ||
      process.env.PACKLOG_AI_ALLOW_IMPORT_URL === "true")
  );
}

function tierAllowsAction(action: string, body: unknown): boolean {
  if (isPro(body)) return true;
  if (action === "parse-trip" && parseTripBypassPro()) return true;
  if (action === "import-screenshot" && visionImportBypassPro()) return true;
  if (action === "import-url" && importUrlBypassPro()) return true;
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
      message: "AI is not configured on this server.",
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

function assertFetchableHttpUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw new Error("INVALID_URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("INVALID_URL");
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host.endsWith(".local")
  ) {
    throw new Error("BLOCKED_HOST");
  }
  return u;
}

function normalizeImportItemCategory(raw: unknown): Item["category"] {
  const s = String(raw ?? "misc").toLowerCase();
  if (s.includes("foot") || s.includes("鞋")) return "apparel";
  if (s === "tech" || s.includes("digital") || s.includes("电子")) return "tech";
  if (s === "optic" || s.includes("photo") || s.includes("相机") || s.includes("镜头"))
    return "optic";
  if (
    s === "health" ||
    s.includes("toilet") ||
    s.includes("洗") ||
    s.includes("护") ||
    s.includes("药")
  )
    return "health";
  if (s === "doc" || s.includes("visa") || s.includes("证") || s.includes("护照")) return "doc";
  if (s === "apparel" || s.includes("cloth") || s.includes("衣")) return "apparel";
  return "misc";
}

const IMPORT_URL_SYSTEM = `你是装备清单提取器。用户给了一段从网页抓取的纯文本（可能含噪声）。
请识别其中的装备/物品清单，只输出 **JSON 数组**（不要 Markdown、不要解释）。

每项对象字段：
- "name": string 主名称（中文页面优先中文；英文页面可用英文）
- "name_zh": string|null 若 name 为英文且能推断中文则填写，否则 null
- "brand": string|null
- "weight_g": number|null 单件克重；无法估计填 null
- "quantity": number 默认 1
- "category": 必须是 "tech"|"apparel"|"doc"|"health"|"optic"|"misc" 之一（鞋类归 apparel）
- "note": string|null 推荐理由、使用场景或原文要点摘要；没有则 null

若不是装备/购物清单，返回 []。`;

async function handleImportUrl(body: unknown): Promise<Response> {
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const urlRaw = typeof o.url === "string" ? o.url.trim() : "";
  if (!urlRaw) {
    return json({ ok: false, code: "MISSING_URL", message: "缺少 url 字段。" }, 400);
  }

  let u: URL;
  try {
    u = assertFetchableHttpUrl(urlRaw);
  } catch {
    return json(
      { ok: false, code: "INVALID_URL", message: "仅支持 http(s) 公网链接，且禁止 localhost。" },
      400,
    );
  }

  const key = anthropicKey();
  if (!key) {
    return json({
      ok: false,
      code: "AI_NOT_CONFIGURED",
      message: "AI is not configured on this server.",
    });
  }

  let html: string;
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), 25_000);
  try {
    const res = await fetch(u.href, {
      redirect: "follow",
      headers: {
        "user-agent": "PACKLOG/1.0 (gear-list import; +https://packlog.app)",
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
      signal: ac.signal,
    });
    if (!res.ok) {
      return json(
        { ok: false, code: "FETCH_FAILED", message: `抓取失败 HTTP ${res.status}` },
        res.status >= 500 ? 502 : 400,
      );
    }
    html = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, code: "FETCH_FAILED", message: msg }, 502);
  } finally {
    clearTimeout(tid);
  }

  if (html.length > 2_000_000) {
    return json({ ok: false, code: "PAGE_TOO_LARGE", message: "页面过大。" }, 413);
  }

  const plain = htmlToPlainText(html, 200_000);
  const clipped = plain.slice(0, 100_000);
  if (!clipped.trim()) {
    return json({ ok: false, code: "EMPTY_PAGE", message: "未能从页面提取到正文。" }, 400);
  }

  const model = defaultModel();
  try {
    const raw = await anthropicMessagesText({
      apiKey: key,
      model,
      system: IMPORT_URL_SYSTEM,
      user: `页面 URL：${u.href}\n\n正文如下：\n\n${clipped}`,
      maxTokens: 8192,
      temperature: 0.2,
    });
    const arr = parseJsonArrayFromModelText(raw);
    type OutRow = {
      name: string;
      name_zh: string | null;
      brand: string | null;
      weight_g: number | null;
      quantity: number;
      category: Item["category"];
      note: string | null;
    };
    const items = arr
      .map((row): OutRow | null => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const name = String(r.name ?? "").trim();
        if (!name) return null;
        const nameZh = typeof r.name_zh === "string" ? r.name_zh.trim() : "";
        const brand = typeof r.brand === "string" ? r.brand.trim() : "";
        const qty =
          typeof r.quantity === "number" && Number.isFinite(r.quantity)
            ? Math.max(1, Math.round(r.quantity))
            : 1;
        let weightG =
          typeof r.weight_g === "number" && Number.isFinite(r.weight_g)
            ? Math.round(r.weight_g)
            : null;
        if (weightG !== null && (weightG < 0 || weightG > 500_000)) weightG = null;
        const category = normalizeImportItemCategory(r.category);
        const note = typeof r.note === "string" ? r.note.trim() : "";
        return {
          name,
          name_zh: nameZh || null,
          brand: brand || null,
          weight_g: weightG,
          quantity: qty,
          category,
          note: note || null,
        };
      })
      .filter((x): x is OutRow => x !== null);
    return json({ ok: true, items, model });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ ok: false, code: "PARSE_FAILED", message: msg }, 502);
  }
}

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
      message: "AI is not configured on this server.",
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
      message: "Pro subscription required.",
    });
  }

  const key = anthropicKey();
  if (!key) {
    return json({
      ok: false,
      code: "AI_NOT_CONFIGURED",
      message: "AI is not configured on this server.",
      action,
    });
  }

  if (action === "parse-trip") {
    return handleParseTrip(body);
  }

  if (action === "import-screenshot") {
    return handleImportScreenshot(body);
  }

  if (action === "import-url") {
    return handleImportUrl(body);
  }

  void key;
  return json({
    ok: false,
    code: "NOT_IMPLEMENTED",
    message: "该 AI action 尚未实现；请参考 PACKLOG-AI.md。",
    action,
  });
}
