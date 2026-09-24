/**
 * Fetch JoyAI explore static prompt sources → data/index.json + data/pages/*.json
 * Skips live markets (Domer / Civitai / PixAI).
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFamiliesPayload } from "./families-def.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");
const PAGE_SIZE = 50;
const YUKKCAT =
  "https://cdn.jsdelivr.net/gh/yukkcat/image-prompts@main/dist/sources";

const SOURCES = [
  {
    id: "gpt-image-2-prompts",
    label: "GPT Image 2",
    homepage: "https://github.com/freestylefly/awesome-gpt-image-2",
    kind: "yukkcat",
    media: "image",
    url: `${YUKKCAT}/freestylefly-gpt-image-2.json`,
  },
  {
    id: "awesome-gpt-image",
    label: "Awesome GPT Image",
    homepage: "https://github.com/ZeroLu/awesome-gpt-image",
    kind: "yukkcat",
    media: "image",
    url: `${YUKKCAT}/awesome-gpt-image.json`,
  },
  {
    id: "awesome-gpt4o-image-prompts",
    label: "GPT-4o Prompts",
    homepage: "https://github.com/ImgEdify/Awesome-GPT4o-Image-Prompts",
    kind: "yukkcat",
    media: "image",
    url: `${YUKKCAT}/awesome-gpt4o-image-prompts.json`,
  },
  {
    id: "xianyu-awesome-gptimage2",
    label: "咸鱼 GPT Image 2",
    homepage: "https://github.com/xianyu110/awesome-gptimage2",
    kind: "xianyu-json",
    media: "image",
    url: "https://cdn.jsdelivr.net/gh/xianyu110/awesome-gptimage2@main/data/latest-prompts.json",
  },
  {
    id: "youmind-gpt-image-2",
    label: "YouMind GPT Image 2",
    homepage: "https://github.com/YouMind-OpenLab/awesome-gpt-image-2",
    kind: "yukkcat",
    media: "image",
    url: `${YUKKCAT}/youmind-gpt-image-2.json`,
  },
  {
    id: "youmind-nano-banana-pro",
    label: "Nano Banana Pro",
    homepage: "https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts",
    kind: "yukkcat",
    media: "image",
    url: `${YUKKCAT}/youmind-nano-banana-pro.json`,
  },
  {
    id: "davidwu-gpt-image2-prompts",
    label: "DavidWu Prompts",
    homepage: "https://github.com/davidwuw0811-boop/awesome-gpt-image2-prompts",
    kind: "yukkcat",
    media: "image",
    url: `${YUKKCAT}/davidwu-gpt-image2-prompts.json`,
  },
  {
    id: "banana-prompt-quicker",
    label: "Banana Quicker",
    homepage: "https://glidea.github.io/banana-prompt-quicker/",
    kind: "yukkcat",
    media: "image",
    url: `${YUKKCAT}/banana-prompt-quicker.json`,
  },
  {
    id: "xianyu-multi-model",
    label: "image-prompt-generator",
    homepage: "https://github.com/xianyu110/image-prompt-generator",
    kind: "xianyu-gallery",
    media: "image",
    url: "https://cdn.jsdelivr.net/gh/xianyu110/image-prompt-generator@main/data/prompts.json",
  },
  {
    id: "youmind-seedance-2",
    label: "YouMind Seedance",
    homepage: "https://github.com/YouMind-OpenLab/awesome-seedance-2-prompts",
    kind: "youmind-readme",
    media: "video",
    modelId: "seedance-2.0",
    tag: "seedance",
    url: "https://cdn.jsdelivr.net/gh/YouMind-OpenLab/awesome-seedance-2-prompts@main/README_zh.md",
  },
  {
    id: "youmind-seedream-4.5",
    label: "YouMind Seedream",
    homepage: "https://github.com/YouMind-OpenLab/awesome-seedream-4.5",
    kind: "youmind-readme",
    media: "image",
    modelId: "seedream-4.5",
    tag: "seedream",
    url: "https://cdn.jsdelivr.net/gh/YouMind-OpenLab/awesome-seedream-4.5@main/README_zh.md",
  },
  {
    id: "youmind-grok-imagine",
    label: "YouMind Grok Imagine",
    homepage: "https://github.com/YouMind-OpenLab/awesome-grok-imagine-prompts",
    kind: "youmind-readme",
    media: "video",
    modelId: "grok-imagine",
    tag: "grok",
    url: "https://cdn.jsdelivr.net/gh/YouMind-OpenLab/awesome-grok-imagine-prompts@main/README_zh.md",
  },
  {
    id: "youmind-gemini-3",
    label: "YouMind Gemini 3",
    homepage: "https://github.com/YouMind-OpenLab/awesome-gemini-3-prompts",
    kind: "youmind-readme",
    media: "image",
    modelId: "gemini-3",
    tag: "gemini",
    url: "https://cdn.jsdelivr.net/gh/YouMind-OpenLab/awesome-gemini-3-prompts@main/README_zh.md",
  },
  {
    id: "ericgood-seedance",
    label: "Seedance 画廊",
    homepage: "https://github.com/Ericgood/seedance-prompt",
    kind: "ericgood-video",
    media: "video",
    url: "https://cdn.jsdelivr.net/gh/Ericgood/seedance-prompt@main/prompts.json",
  },
];

function pad(n, w = 4) {
  return String(n).padStart(w, "0");
}

function hashId(input) {
  return createHash("sha1").update(input).digest("hex").slice(0, 12);
}

function absoluteUrl(baseUrl, path) {
  const p = String(path || "").trim();
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  try {
    return new URL(p, baseUrl).href;
  } catch {
    return "";
  }
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json,*/*" },
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, {
    headers: { Accept: "text/plain,*/*" },
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

function item(partial, def) {
  const media = partial.media || def.media || "image";
  const coverUrl = partial.coverUrl || "";
  const videoUrl = partial.videoUrl || (media === "video" ? partial.mediaUrl || null : null);
  return {
    id: partial.id,
    title: partial.title,
    prompt: partial.prompt,
    media,
    model: partial.model || null,
    coverUrl: coverUrl || (media === "image" ? partial.mediaUrl || "" : partial.thumbnailUrl || ""),
    videoUrl: videoUrl || null,
    tags: [...new Set((partial.tags || []).filter(Boolean))],
    author: partial.author || def.label,
    source: def.id,
    sourceUrl: partial.sourceUrl || def.homepage,
    license: "upstream",
    createdAt: partial.createdAt || null,
  };
}

function loadYukkcat(def, data) {
  if (!Array.isArray(data)) return [];
  const out = [];
  const seen = new Set();
  data.forEach((raw, index) => {
    const row = raw ?? {};
    const title = String(row.title ?? "").trim();
    const prompt = String(row.prompt ?? "").trim();
    if (!title || !prompt) return;
    const refs = (row.referenceImageUrls ?? [])
      .map((u) => absoluteUrl(def.url, String(u || "").trim()))
      .filter(Boolean);
    const cover =
      absoluteUrl(def.url, String(row.coverUrl ?? "").trim()) || refs[0] || "";
    if (!cover) return;
    const id = String(row.id ?? "").trim() || `${def.id}-${pad(index + 1)}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(
      item(
        {
          id: `${def.id}:${id}`,
          title,
          prompt,
          media: "image",
          mediaUrl: cover,
          coverUrl: cover,
          model: String(row.imageModel ?? "").trim() || null,
          tags: [
            def.id,
            ...(Array.isArray(row.tags) ? row.tags.map(String) : []),
          ],
          author: String(row.author ?? "").trim() || def.label,
          sourceUrl: String(row.sourceUrl ?? "").trim() || def.homepage,
          createdAt: String(row.createdAt ?? "").trim() || null,
        },
        def,
      ),
    );
  });
  return out;
}

function loadXianyu(def, data) {
  const flat = [];
  if (Array.isArray(data.dates)) {
    for (const d of data.dates) {
      if (Array.isArray(d.items)) flat.push(...d.items);
    }
  }
  if (Array.isArray(data.items)) flat.push(...data.items);
  const out = [];
  const seen = new Set();
  flat.forEach((row, index) => {
    const prompt = String(row.prompt ?? "").trim();
    const media =
      String(row.primary_image_url ?? "").trim() ||
      (row.image_urls?.[0] ? String(row.image_urls[0]).trim() : "");
    if (!prompt || !media) return;
    const sourceUrl = String(row.x_url || row.url || "").trim();
    const key = sourceUrl || `${def.id}-${pad(index + 1)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(
      item(
        {
          id: `${def.id}:${hashId(key)}`,
          title: String(row.reason ?? "").trim() || prompt.slice(0, 48) || def.label,
          prompt,
          media: "image",
          mediaUrl: media,
          coverUrl: media,
          model: "gpt-image-2",
          tags: [def.id, "x"],
          author: String(row.author ?? "").trim() || "X",
          sourceUrl: sourceUrl || def.homepage,
          createdAt: String(row.created_at ?? "").trim() || null,
        },
        def,
      ),
    );
  });
  return out;
}

function loadXianyuGallery(def, data) {
  const rows = Array.isArray(data.prompts) ? data.prompts : [];
  const assetBase = def.url.replace(/\/data\/[^/]+$/, "/");
  const out = [];
  const seen = new Set();
  rows.forEach((row, index) => {
    const prompt = String(row.prompt ?? "").trim();
    const imagePath = String(row.image ?? "").trim();
    if (!prompt || !imagePath) return;
    const media = absoluteUrl(assetBase, imagePath);
    if (!media) return;
    const id = String(row.id ?? "").trim() || `${def.id}-${pad(index + 1)}`;
    if (seen.has(id)) return;
    seen.add(id);
    const model = String(row.model ?? "").trim();
    out.push(
      item(
        {
          id: `${def.id}:${id}`,
          title: String(row.title ?? "").trim() || prompt.slice(0, 48) || def.label,
          prompt,
          media: "image",
          mediaUrl: media,
          coverUrl: media,
          model: model || null,
          tags: [
            def.id,
            model,
            String(row.category ?? "").trim(),
            ...(Array.isArray(row.tags) ? row.tags.map(String) : []),
          ],
          author: String(row.source ?? "").trim() || def.label,
          sourceUrl: String(row.sourceUrl ?? "").trim() || def.homepage,
        },
        def,
      ),
    );
  });
  return out;
}

function isPlayableVideo(url) {
  return /\.mp4(\?|#|$)/i.test(url) || /video/i.test(url);
}

async function loadYoumindReadme(def) {
  const videoUrlsUrl = def.url.replace(/\/[^/]+$/, "/video-urls.json");
  const [markdown, videoJson] = await Promise.all([
    getText(def.url),
    getJson(videoUrlsUrl).catch(() => ({})),
  ]);
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
    const video = isPlayableVideo(rawVideo) ? rawVideo : "";
    const mediaUrl = video || thumb;
    if (!mediaUrl) continue;
    const title = rawTitle.replace(/^No\.\s*\d+:\s*/i, "").trim() || def.label;
    const authorMatch =
      body.match(
        /\*\*(?:Author|作者)\*\*[：:]\s*(?:\[([^\]]+)\]\([^)]+\)|([^\n*|]+))/i,
      ) || body.match(/\*\*(?:Author|作者)\*\*[：:]\s*\[([^\]]+)\]/i);
    const author =
      (authorMatch?.[1] || authorMatch?.[2] || "").trim() || def.label;
    const publishedMatch = body.match(
      /\*\*(?:Published|发布|发布时间)\*\*[：:]\s*([^\n*|]+)/i,
    );
    let createdAt = null;
    if (publishedMatch?.[1]) {
      const t = Date.parse(publishedMatch[1].trim());
      if (Number.isFinite(t)) createdAt = new Date(t).toISOString();
    }
    out.push(
      item(
        {
          id: `${def.id}:${id}`,
          title,
          prompt,
          media: video ? "video" : "image",
          mediaUrl,
          coverUrl: thumb || mediaUrl,
          videoUrl: video || null,
          thumbnailUrl: thumb,
          model: def.modelId || null,
          tags: [def.id, def.tag, "youmind"].filter(Boolean),
          author,
          createdAt,
        },
        def,
      ),
    );
  }
  return out;
}

function loadEricgood(def, data) {
  if (!Array.isArray(data)) return [];
  const assetBase = def.url.replace(/\/[^/]+$/, "/");
  const out = [];
  const seen = new Set();
  data.forEach((raw, index) => {
    const row = raw ?? {};
    const prompt = String(row.prompt ?? "").trim();
    if (!prompt) return;
    const videoPath = String(row.video ?? "").trim();
    const thumbPath = String(row.thumbnail ?? "").trim();
    const video = videoPath ? absoluteUrl(assetBase, videoPath) : "";
    const thumb = thumbPath ? absoluteUrl(assetBase, thumbPath) : "";
    const mediaUrl = video || thumb;
    if (!mediaUrl) return;
    const id = String(row.id ?? "").trim() || `${def.id}-${pad(index + 1)}`;
    if (seen.has(id)) return;
    seen.add(id);
    out.push(
      item(
        {
          id: `${def.id}:${id}`,
          title:
            String(row.title_zh ?? "").trim() ||
            String(row.title ?? "").trim() ||
            def.label,
          prompt,
          media: video ? "video" : "image",
          mediaUrl,
          coverUrl: thumb || mediaUrl,
          videoUrl: video || null,
          model: String(row.model ?? "Seedance 2.0").trim() || "seedance-2.0",
          tags: [def.id, String(row.category || row.tag || "").trim()],
          author: String(row.author ?? "").trim() || def.label,
        },
        def,
      ),
    );
  });
  return out;
}

async function loadSource(def) {
  console.log(`→ ${def.id} (${def.kind})`);
  try {
    if (def.kind === "youmind-readme") {
      const mirrors = [
        def.url
          .replace("https://cdn.jsdelivr.net/gh/", "https://raw.githubusercontent.com/")
          .replace("@main/", "/main/"),
        def.url,
      ];
      let lastErr;
      let items = [];
      for (const url of mirrors) {
        try {
          items = await loadYoumindReadme({ ...def, url });
          if (items.length) break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (!items.length && lastErr) throw lastErr;
      console.log(`  ${items.length} items`);
      return items;
    }
    const data = await getJson(def.url);
    let items = [];
    if (def.kind === "yukkcat") items = loadYukkcat(def, data);
    else if (def.kind === "xianyu-json") items = loadXianyu(def, data);
    else if (def.kind === "xianyu-gallery") items = loadXianyuGallery(def, data);
    else if (def.kind === "ericgood-video") items = loadEricgood(def, data);
    console.log(`  ${items.length} items`);
    return items;
  } catch (err) {
    console.error(`  FAIL ${def.id}:`, err.message || err);
    return [];
  }
}

async function main() {
  const all = [];
  const bySource = {};
  for (const def of SOURCES) {
    const items = await loadSource(def);
    bySource[def.id] = {
      id: def.id,
      label: def.label,
      homepage: def.homepage,
      kind: def.kind,
      media: def.media,
      count: items.length,
    };
    all.push(...items);
  }

  // dedupe by id
  const seen = new Set();
  const unique = [];
  for (const it of all) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    unique.push(it);
  }

  await rm(join(DATA, "pages"), { recursive: true, force: true });
  await mkdir(join(DATA, "pages"), { recursive: true });
  await mkdir(join(DATA, "by-source"), { recursive: true });

  const pages = [];
  for (let i = 0; i < unique.length; i += PAGE_SIZE) {
    const chunk = unique.slice(i, i + PAGE_SIZE);
    const name = pad(Math.floor(i / PAGE_SIZE) + 1);
    pages.push(name);
    await writeFile(
      join(DATA, "pages", `${name}.json`),
      JSON.stringify({ items: chunk }, null, 2),
      "utf8",
    );
  }

  const models = [
    ...new Set(unique.map((x) => x.model).filter(Boolean)),
  ].sort();
  const sources = Object.values(bySource);
  const familiesPayload = buildFamiliesPayload(sources, {
    iconBase: "brand/models",
  });

  const index = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    total: unique.length,
    pageSize: PAGE_SIZE,
    pages,
    models,
    sources,
    iconBase: familiesPayload.iconBase,
    tabs: familiesPayload.tabs,
    catalogTabs: familiesPayload.catalogTabs,
    families: familiesPayload.families,
    note: "Static imports from JoyAI explore PROMPT_SOURCES (excl. Domer/Civitai/PixAI live markets). Header tabs/families + icons for JoyAI consume.",
  };

  await writeFile(join(DATA, "index.json"), JSON.stringify(index, null, 2), "utf8");
  await writeFile(
    join(DATA, "sources.json"),
    JSON.stringify(sources, null, 2),
    "utf8",
  );
  await writeFile(
    join(DATA, "families.json"),
    JSON.stringify(familiesPayload, null, 2),
    "utf8",
  );

  // optional per-source dumps (handy for debugging)
  for (const def of SOURCES) {
    const items = unique.filter((x) => x.source === def.id);
    await writeFile(
      join(DATA, "by-source", `${def.id}.json`),
      JSON.stringify({ items }, null, 2),
      "utf8",
    );
  }

  console.log(`\nDone: ${unique.length} items → ${pages.length} pages`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
