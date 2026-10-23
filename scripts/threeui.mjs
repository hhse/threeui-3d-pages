#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const catalogPath = path.join(skillDir, "references", "catalog.json");
const guidesDir = path.join(skillDir, "references", "guides");

const SYNONYMS = new Map([
  ["液态金属", "liquid metal"],
  ["金属", "metal"],
  ["毛玻璃", "glassmorphism glass"],
  ["玻璃", "glass"],
  ["烟雾", "smoke mist fog"],
  ["粒子", "particle"],
  ["背景", "background"],
  ["按钮", "button cta"],
  ["落地页", "landing page"],
  ["首页", "landing page hero"],
  ["英雄区", "hero"],
  ["标题", "heading typography text animation"],
  ["文字", "text typography"],
  ["字体", "typography type"],
  ["卡片", "card gallery"],
  ["天气", "weather atmosphere"],
  ["自然", "nature botanical landscape"],
  ["植物", "botanical plant leaf"],
  ["科技", "tech futuristic digital"],
  ["未来", "futuristic sci-fi"],
  ["暗黑", "dark"],
  ["极简", "minimal"],
  ["霓虹", "neon"],
  ["网格", "grid wireframe"],
  ["轨道", "orbital sphere"],
  ["地球", "globe"],
  ["3d", "3d threejs three.js webgl"],
  ["立体", "3d threejs three.js webgl"],
]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadCatalog() {
  if (!fs.existsSync(catalogPath)) {
    fail(
      `Catalog not found at ${catalogPath}. Run node scripts/sync-threeui.mjs first.`,
    );
  }
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

function normalizeQuery(query) {
  let expanded = query.toLowerCase();
  for (const [term, replacement] of SYNONYMS) {
    expanded = expanded.replaceAll(term, ` ${replacement} `);
  }
  return expanded
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/u)
    .filter((token) => token.length > 1);
}

function countOccurrences(text, token) {
  if (!token) return 0;
  return text.split(token).length - 1;
}

function searchItem(item, tokens, phrase, category) {
  if (category && item.category.toLowerCase() !== category.toLowerCase()) {
    return null;
  }

  const label = item.label.toLowerCase();
  const id = item.id.toLowerCase();
  const description = item.description.toLowerCase();
  const tags = item.tags.join(" ").toLowerCase();
  const variants = (item.variants ?? [])
    .map((variant) => `${variant.label} ${variant.description}`)
    .join(" ")
    .toLowerCase();
  const haystack = `${id} ${label} ${description} ${tags} ${variants}`;

  if (phrase && haystack.includes(phrase)) {
    // Phrase matching is handled by the same token score below.
  }

  let score = phrase && label.includes(phrase) ? 18 : 0;
  const reasons = [];

  for (const token of tokens) {
    let tokenScore = 0;
    if (id === token || label === token) tokenScore += 20;
    if (label.includes(token)) tokenScore += 7;
    if (id.includes(token)) tokenScore += 5;
    if (tags.includes(token)) tokenScore += countOccurrences(tags, token) * 4;
    if (variants.includes(token)) tokenScore += 3;
    if (description.includes(token)) tokenScore += 2;
    if (item.category.toLowerCase().includes(token)) tokenScore += 1;

    if (tokenScore > 0) {
      score += tokenScore;
      reasons.push(token);
    }
  }

  if (score === 0) return null;
  return { item, score, reasons };
}

function formatItem(item, score) {
  const variantCount = item.variants?.length ?? 0;
  const guidePath = path.join(guidesDir, `${item.id}.md`);
  const guide = fs.existsSync(guidePath) ? "guide: available" : "guide: source-only";
  const variants = variantCount > 0 ? `variants: ${variantCount}` : "variant: 1";
  const relationship = item.variantOf ? `child of: ${item.variantOf}` : "";
  return [
    `${item.id} | ${item.label} | ${item.category} | score ${score}`,
    `  ${item.description}`,
    `  runtime: ${item.runtime}`,
    `  import: ${item.importName}; ${variants}; ${guide}`,
    ...(relationship ? [`  ${relationship}`] : []),
  ].join("\n");
}

function commandSearch(args) {
  const catalog = loadCatalog();
  let category = "";
  let limit = 6;
  const queryParts = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--category") {
      category = args[index + 1] ?? "";
      index += 1;
    } else if (arg === "--limit") {
      limit = Number.parseInt(args[index + 1] ?? "6", 10);
      index += 1;
    } else {
      queryParts.push(arg);
    }
  }

  const query = queryParts.join(" ").trim();
  if (!query) {
    const counts = new Map();
    for (const item of catalog.items) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    console.log(
      `${catalog.source.parentCount} parent items, ${catalog.source.recordCount} records, ${catalog.source.resultCount} visible results`,
    );
    for (const [name, count] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
      console.log(`  ${name}: ${count}`);
    }
    return;
  }

  const tokens = normalizeQuery(query);
  const phrase = tokens.join(" ");
  const results = catalog.items
    .map((item) => searchItem(item, tokens, phrase, category))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .slice(0, Math.max(1, Math.min(limit, 20)));

  if (results.length === 0) {
    console.log(`No ThreeUI Community item matched: ${query}`);
    console.log("Try a shorter effect, category, or visual property.");
    return;
  }

  console.log(`Matches for: ${query}`);
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${formatItem(result.item, result.score)}`);
    console.log(`  matched: ${result.reasons.join(", ")}`);
  });
}

function resolveItem(catalog, value) {
  if (!value) return null;
  const needle = value.toLowerCase();
  const exact = catalog.items.find((item) => item.id.toLowerCase() === needle);
  if (exact) return exact;

  const matches = catalog.items.filter(
    (item) =>
      item.label.toLowerCase() === needle ||
      item.id.toLowerCase().includes(needle) ||
      item.label.toLowerCase().includes(needle),
  );
  return matches.length === 1 ? matches[0] : matches;
}

function commandShow(args) {
  const catalog = loadCatalog();
  const resolved = resolveItem(catalog, args[0]);
  if (!resolved) fail("Usage: node scripts/threeui.mjs show <item-id>");
  if (Array.isArray(resolved)) {
    console.log("Multiple matches:");
    resolved.forEach((item) => console.log(`  ${item.id} | ${item.label}`));
    return;
  }

  const item = resolved;
  const guidePath = path.join(guidesDir, `${item.id}.md`);
  console.log(JSON.stringify({
    id: item.id,
    label: item.label,
    category: item.category,
    description: item.description,
    tags: item.tags,
    runtime: item.runtime,
    importName: item.importName,
    interaction: item.interaction,
    passes: item.passes,
    asset: item.asset,
    sourceFiles: item.sourceFiles,
    controls: item.controls ?? [],
    variants: item.variants ?? [],
    implementationGuide: fs.existsSync(guidePath) ? guidePath : null,
    package: "@designcodeio/threeui",
    officialPage: `https://threeui.com/browse?shader=${encodeURIComponent(item.id)}`,
  }, null, 2));
}

function commandGuide(args) {
  const catalog = loadCatalog();
  const resolved = resolveItem(catalog, args[0]);
  if (!resolved) fail("Usage: node scripts/threeui.mjs guide <item-id>");
  if (Array.isArray(resolved)) {
    console.log("Multiple matches:");
    resolved.forEach((item) => console.log(`  ${item.id} | ${item.label}`));
    return;
  }

  const guidePath = path.join(guidesDir, `${resolved.id}.md`);
  if (!fs.existsSync(guidePath)) {
    console.log(`No bundled implementation guide for ${resolved.id}.`);
    console.log(`Use the package import ${resolved.importName} and inspect:`);
    resolved.sourceFiles.forEach((file) => console.log(`  ${file}`));
    return;
  }
  process.stdout.write(fs.readFileSync(guidePath, "utf8"));
}

function main() {
  const [command = "search", ...args] = process.argv.slice(2);
  if (command === "search") commandSearch(args);
  else if (command === "show") commandShow(args);
  else if (command === "guide") commandGuide(args);
  else {
    fail("Usage: threeui.mjs [search <query> | show <id> | guide <id>]");
  }
}

main();
