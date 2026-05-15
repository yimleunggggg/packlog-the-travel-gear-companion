/** Strip HTML/SCRIPT for safe-ish plain text extraction (URL import pipeline). */
export function htmlToPlainText(html: string, maxLen = 120_000): string {
  const noScript = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  const noTags = noScript.replace(/<[^>]+>/g, " ");
  const collapsed = noTags.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, maxLen);
}
