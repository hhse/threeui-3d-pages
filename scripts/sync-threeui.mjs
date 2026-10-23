#!/usr/bin/env node

import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillDir = path.resolve(scriptDir, "..");
const referencesDir = path.join(skillDir, "references");
const guidesDir = path.join(referencesDir, "guides");
const catalogPath = path.join(referencesDir, "catalog.json");

function parseOptions(argv) {
  const options = {
    repo: "MengTo/threeui",
    ref: "main",
    sourceRoot: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") options.repo = argv[++index] ?? options.repo;
    else if (arg === "--ref") options.ref = argv[++index] ?? options.ref;
    else if (arg === "--source-root") options.sourceRoot = argv[++index] ?? "";
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

async function readRelative(options, relativePath) {
  if (options.sourceRoot) {
    return fs.readFile(path.join(options.sourceRoot, relativePath), "utf8");
  }
  const url = `https://raw.githubusercontent.com/${options.repo}/${options.ref}/${relativePath}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function findBalanced(source, openIndex, openChar, closeChar) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === openChar) depth += 1;
    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error(`Unbalanced ${openChar}${closeChar} expression`);
}

function splitTopLevelObjects(arraySource) {
  const objects = [];
  let objectStart = -1;
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = 0; index < arraySource.length; index += 1) {
    const char = arraySource[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") {
      if (depth === 0) objectStart = index;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        objects.push(arraySource.slice(objectStart, index + 1));
        objectStart = -1;
      }
    }
  }
  return objects;
}

function parseShaderMetadata(source) {
  const marker = "export const READY_SHADERS";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error("READY_SHADERS not found in shaders.tsx");

  const assignmentIndex = source.indexOf("=", markerIndex);
  const arrayStart = source.indexOf("[", assignmentIndex);
  const arrayEnd = findBalanced(source, arrayStart, "[", "]");
  const arraySource = source.slice(arrayStart, arrayEnd + 1);
  const entries = splitTopLevelObjects(arraySource);

  return entries.map((entry) => {
    const spreadIndex = entry.indexOf("...");
    if (spreadIndex < 0) throw new Error("Unexpected shader entry without a spread wrapper");
    const innerStart = entry.indexOf("{", spreadIndex + 3);
    const componentIndex = entry.lastIndexOf(", component:");
    const innerEnd = componentIndex >= 0
      ? entry.lastIndexOf("}", componentIndex)
      : entry.lastIndexOf("}");
    const jsonText = entry.slice(innerStart, innerEnd + 1);
    return JSON.parse(jsonText);
  });
}

function parseSkillGuides(source) {
  const marker = "const SKILLS";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error("SKILLS not found in buildSkillMarkdown.js");
  const objectStart = source.indexOf("{", markerIndex);
  const objectEnd = findBalanced(source, objectStart, "{", "}");
  return JSON.parse(source.slice(objectStart, objectEnd + 1));
}

function compactItem(item, guideIds) {
  return {
    id: item.id,
    ...(item.variantOf ? { variantOf: item.variantOf } : {}),
    category: item.category,
    label: item.label,
    description: item.description,
    tags: item.tags ?? [],
    runtime: item.runtime,
    importName: item.importName,
    sourceFiles: item.sourceFiles ?? [],
    passes: item.passes,
    interaction: item.interaction,
    asset: item.asset,
    assetCount: item.assetCount,
    ...(item.controls ? { controls: item.controls } : {}),
    ...(item.variants
      ? {
          variants: item.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            description: variant.description,
            props: variant.props,
          })),
        }
      : {}),
    implementationGuide: guideIds.has(item.id)
      ? `guides/${item.id}.md`
      : null,
  };
}

async function writeAtomic(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp`;
  await fs.writeFile(temporaryPath, content);
  await fs.rename(temporaryPath, filePath);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const [shaderSource, guideSource] = await Promise.all([
    readRelative(options, "src/data/shaders.tsx"),
    readRelative(options, "src/components/buildSkillMarkdown.js"),
  ]);

  const shaderItems = parseShaderMetadata(shaderSource);
  const guides = parseSkillGuides(guideSource);
  const guideIds = new Set(Object.keys(guides));
  const parentItems = shaderItems.filter((item) => !item.variantOf);
  const resultCount = parentItems.reduce(
    (total, item) => total + (item.variants?.length || 1),
    0,
  );

  await fs.mkdir(guidesDir, { recursive: true });
  const expectedGuideNames = new Set(
    Object.keys(guides).map((id) => `${id}.md`),
  );
  for (const fileName of await fs.readdir(guidesDir)) {
    if (fileName.endsWith(".md") && !expectedGuideNames.has(fileName)) {
      await fs.unlink(path.join(guidesDir, fileName));
    }
  }
  await Promise.all(
    Object.entries(guides).map(([id, markdown]) =>
      writeAtomic(path.join(guidesDir, `${id}.md`), markdown),
    ),
  );

  const catalog = {
    schemaVersion: 1,
    source: {
      repo: options.repo,
      ref: options.ref,
      shaders: "src/data/shaders.tsx",
      guides: "src/components/buildSkillMarkdown.js",
      fetchedAt: new Date().toISOString(),
      parentCount: parentItems.length,
      recordCount: shaderItems.length,
      resultCount,
      guideCount: Object.keys(guides).length,
    },
    items: shaderItems.map((item) => compactItem(item, guideIds)),
  };

  await writeAtomic(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(
    `Synced ${catalog.source.parentCount} parent items, ${catalog.source.resultCount} results, and ${catalog.source.guideCount} guides.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
