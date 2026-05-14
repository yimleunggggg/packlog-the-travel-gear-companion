#!/usr/bin/env node
/**
 * 1) Ensures en / zh / ja dictionaries declare the same keys.
 * 2) Reports static t("key") / t('key') usages in src/ missing from English dict.
 */
import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");
const i18nPath = path.join(root, "src/lib/i18n.tsx");

function walkTs(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkTs(p, out);
    else if (/\.(tsx|ts)$/.test(name) && !name.includes(".test.")) out.push(p);
  }
  return out;
}

function keysFromDictBlock(block) {
  const keys = new Set();
  for (const m of block.matchAll(/"([^"]+)":/g)) keys.add(m[1]);
  // Prettier may format safe identifiers as shorthand keys (`lifecycle:` ≡ `"lifecycle"`).
  for (const m of block.matchAll(/^ {4}([a-zA-Z_][a-zA-Z0-9_]*): /gm)) keys.add(m[1]);
  return keys;
}

function loadLangKeys(text) {
  const iZh = text.indexOf("\n  zh: {");
  const iJa = text.indexOf("\n  ja: {");
  const iClose = text.lastIndexOf("\n};");
  if (iZh < 0 || iJa < 0 || iClose < 0)
    throw new Error("Could not slice en/zh/ja blocks in i18n.tsx");

  const enBlock = text.slice(0, iZh);
  const zhBlock = text.slice(iZh, iJa);
  const jaBlock = text.slice(iJa, iClose);

  return {
    en: keysFromDictBlock(enBlock),
    zh: keysFromDictBlock(zhBlock),
    ja: keysFromDictBlock(jaBlock),
  };
}

function diff(a, b) {
  return [...a].filter((k) => !b.has(k)).sort();
}

const text = fs.readFileSync(i18nPath, "utf8");
const { en, zh, ja } = loadLangKeys(text);

let exit = 0;

const dZh = diff(en, zh);
const dJa = diff(en, ja);
const dZy = diff(zh, en);
const dJy = diff(ja, en);

if (dZh.length || dJa.length || dZy.length || dJy.length) {
  console.error("i18n: dictionary key mismatch across languages.");
  if (dZh.length) console.error("  en − zh:", dZh.join(", "));
  if (dJa.length) console.error("  en − ja:", dJa.join(", "));
  if (dZy.length) console.error("  zh − en:", dZy.join(", "));
  if (dJy.length) console.error("  ja − en:", dJy.join(", "));
  exit = 1;
} else {
  console.log(`i18n: en/zh/ja key parity OK (${en.size} keys each).`);
}

const staticUsed = new Set();
for (const file of walkTs(path.join(root, "src"))) {
  const s = fs.readFileSync(file, "utf8");
  for (const m of s.matchAll(/\bt\(\s*["']([^"']+)["']\s*\)/g)) staticUsed.add(m[1]);
}

const missing = [...staticUsed].filter((k) => !en.has(k)).sort();
if (missing.length) {
  console.error("i18n: static t() keys not found in English dict:");
  missing.forEach((k) => console.error("  ", k));
  exit = 1;
} else {
  console.log(`i18n: static t() keys OK (${staticUsed.size} keys referenced).`);
}

process.exit(exit);
