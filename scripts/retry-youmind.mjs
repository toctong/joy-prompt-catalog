/**
 * Retry YouMind README sources that often fail on jsDelivr.
 * Merges into existing data/pages (rebuilds full catalog from by-source + new items).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");
const PAGE_SIZE = 50;

const RETRIES = [
  {
    id: "youmind-seedance-2",
    label: "YouMind Seedance",
    homepage: "https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts",
    media: "video",
    modelId: "seedance-2.0",
    tag: "seedance",
    urls: [
      "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedance-2-prompts/main/README_zh.md",
      "https://cdn.jsdelivr.net/gh/YouMind-OpenLab/awesome-seedance-2-prompts@main/README_zh.md",
      "https://ghproxy.net/https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedance-2-prompts/main/README_zh.md",
    ],
    videoUrls: [
      "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedance-2-prompts/main/video-urls.json",
      "https://cdn.jsdelivr.net/gh/YouMind-OpenLab/awesome-seedance-2-prompts@main/video-urls.json",
    ],
  },
  {
    id: "youmind-seedream-4.5",
    label: "YouMind Seedream",
    homepage: "https://github.com/YouMind-OpenLab/awesome-seedream-4.5",
    media: "image",
    modelId: "seedream-4.5",
    tag: "seedream",
    urls: [
      "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedream-4.5/main/README_zh.md",
      "https://cdn.jsdelivr.net/gh/YouMind-OpenLab/awesome-seedream-4.5@main/README_zh.md",
      "https://ghproxy.net/https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedream-4.5/main/README_zh.md",
    ],
    videoUrls: [],
  },
  {
    id: "youmind-grok-imagine",
    label: "YouMind Grok Imagine",
    homepage: "https://github.com/YouMind-OpenLab/awesome-grok-imagine-prompts",
    media: "video",
    modelId: "grok-imagine",
    tag: "grok",
    urls: [
      "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-grok-imagine-prompts/main/README_zh.md",
      "https://cdn.jsdelivr.net/gh/YouMind-OpenLab/awesome-grok-imagine-prompts@main/README_zh.md",
      "https://ghproxy.net/https://raw.githubusercontent.com/YouMind-OpenLab/awesome-grok-imagine-prompts/main/README_zh.md",
    ],
    videoUrls: [
      "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-grok-imagine-prompts/main/video-urls.json",
      "https://cdn.jsdelivr.net/gh/YouMind-OpenLab/awesome-grok-imagine-prompts@main/video-urls.json",
    ],
  },
];

function pad(n, w = 4) {
  return String(n).padStart(w, "0");
}
function hashId(input) {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}

async function fetchText(urls) {
  let last;
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      if (!res.ok) throw new Error(String(res.status));
      const text = await res.text();
      console.log(`  ok ${url.slice(0, 60)}… (${text.length})`);
      return text;
    } catch (e) {
      last = e;
      console.log(`  miss ${url.slice(0, 50)}…`);
    }
  }
  throw last || new Error("all urls failed");
}

async function fetchJson(urls) {
  if (!urls.length) return {};
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      /* next */
    }
  }
  return {};
}

function parseYoumind(def, markdown, videoJson) {
  const videoMap =
    videoJson && typeof videoJson === "object" && videoJson.prompts
      ? videoJson.prompts
      : videoJson || {};
  const out = [];
  const seen = new Set();
  const blockRe = /^### (.+)\n([\s\S]*?)(?=^### |\n## )/gm;
  let match;
  while ((match = blockRe.exec(markdown)) !== null) {
    const rawTitle = match[1].trim();
    const body = match[2] ?? "";
    const promptMatch = body.match(/```(?:[\w-]*)?\n([\s\S]*?)```/);
    const prompt = (promptMatch?.[1] ?? "").trim();
    if (!prompt) continue;
    const idMatch = body.match(/[?&]id=(\d+)/);
    const id =
      idMatch?.[1]?.trim() || hashId(`${rawTitle}\n${prompt.slice(0, 80)}`);
    if (seen.has(id)) continue;
    seen.add(id);
    const imgMatch = body.match(/<img[^>]+src=["']([^"']+)["']/i);
    const thumb = (imgMatch?.[1] ?? "").trim();
    const hrefMatch = body.match(/<a[^>]+href=["']([^"']+\.mp4[^"']*)["']/i);
    const hrefVideo = (hrefMatch?.[1] ?? "").trim();
    const mappedVideo = String(videoMap[id] ?? "").trim();
    const rawVideo = mappedVideo || hrefVideo;
    const video = /\.mp4(\?|#|$)/i.test(rawVideo) ? rawVideo : "";
    const mediaUrl = video || thumb;
    if (!mediaUrl) continue;
    const title = rawTitle.replace(/^No\.\s*\d+:\s*/i, "").trim() || def.label;
    const authorMatch =
      body.match(
        /\*\*(?:Author|作者)\*\*[：:]\s*(?:\[([^\]]+)\]\([^)]+\)|([^\n*|]+))/i,
      ) || body.match(/\*\*(?:Author|作者)\*\*[：:]\s*\[([^\]]+)\]/i);
    const author =
      (authorMatch?.[1] || authorMatch?.[2] || "").trim() || def.label;
    out.push({
      id: `${def.id}:${id}`,
      title,
      prompt,
      media: video ? "video" : "image",
      model: def.modelId || null,
      coverUrl: thumb || mediaUrl,
      videoUrl: video || null,
      tags: [def.id, def.tag, "youmind"].filter(Boolean),
      author,
      source: def.id,
      sourceUrl: def.homepage,
      license: "upstream",
      createdAt: null,
    });
  }
  return out;
}

async function loadAllExisting() {
  const index = JSON.parse(await readFile(join(DATA, "index.json"), "utf8"));
  const items = [];
  for (const name of index.pages) {
    const page = JSON.parse(
      await readFile(join(DATA, "pages", `${name}.json`), "utf8"),
    );
    items.push(...(page.items || []));
  }
  return { index, items };
}

async function writeCatalog(items, sourcesMeta) {
  await rm(join(DATA, "pages"), { recursive: true, force: true });
  await mkdir(join(DATA, "pages"), { recursive: true });
  const pages = [];
  for (let i = 0; i < items.length; i += PAGE_SIZE) {
    const chunk = items.slice(i, i + PAGE_SIZE);
    const name = pad(Math.floor(i / PAGE_SIZE) + 1);
    pages.push(name);
    await writeFile(
      join(DATA, "pages", `${name}.json`),
      JSON.stringify({ items: chunk }, null, 2),
      "utf8",
    );
  }
  const models = [...new Set(items.map((x) => x.model).filter(Boolean))].sort();
  const index = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    total: items.length,
    pageSize: PAGE_SIZE,
    pages,
    models,
    sources: sourcesMeta,
    note: "Static imports from JoyAI explore PROMPT_SOURCES (excl. Domer/Civitai/PixAI live markets).",
  };
  await writeFile(join(DATA, "index.json"), JSON.stringify(index, null, 2), "utf8");
  await writeFile(
    join(DATA, "sources.json"),
    JSON.stringify(sourcesMeta, null, 2),
    "utf8",
  );
  console.log(`Wrote ${items.length} items / ${pages.length} pages`);
}

async function main() {
  const { index, items } = await loadAllExisting();
  const sources = [...(index.sources || [])];
  const keep = items.filter(
    (it) => !RETRIES.some((r) => r.id === it.source),
  );

  for (const def of RETRIES) {
    console.log(`→ retry ${def.id}`);
    try {
      const [md, videoJson] = await Promise.all([
        fetchText(def.urls),
        fetchJson(def.videoUrls),
      ]);
      const parsed = parseYoumind(def, md, videoJson);
      console.log(`  ${parsed.length} items`);
      keep.push(...parsed);
      await writeFile(
        join(DATA, "by-source", `${def.id}.json`),
        JSON.stringify({ items: parsed }, null, 2),
        "utf8",
      );
      const idx = sources.findIndex((s) => s.id === def.id);
      const meta = {
        id: def.id,
        label: def.label,
        homepage: def.homepage,
        kind: "youmind-readme",
        media: def.media,
        count: parsed.length,
      };
      if (idx >= 0) sources[idx] = meta;
      else sources.push(meta);
    } catch (e) {
      console.error(`  FAIL ${def.id}:`, e.message || e);
      const idx = sources.findIndex((s) => s.id === def.id);
      if (idx >= 0) sources[idx] = { ...sources[idx], count: 0 };
    }
  }

  const seen = new Set();
  const unique = [];
  for (const it of keep) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    unique.push(it);
  }
  await writeCatalog(unique, sources);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
