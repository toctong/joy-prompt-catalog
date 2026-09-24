<template>
  <div class="joy-explore">
    <header class="joy-explore-header">
      <div class="joy-explore-tabs" role="tablist">
        <button
          v-for="t in headerTabs"
          :key="t.id"
          type="button"
          class="joy-explore-tab"
          :class="{
            'is-active': familyId === t.id,
            'joy-explore-tab-model': t.kind === 'family',
          }"
          @click="setFamily(t.id)"
        >
          <img
            v-if="t.iconPath || t.icon"
            class="joy-explore-tab-model-icon"
            :class="{ 'is-mono': t.mono }"
            :src="resolveIcon(t)"
            alt=""
          />
          {{ t.label }}
        </button>
      </div>

      <div class="joy-explore-cats">
        <button
          type="button"
          class="joy-explore-cat"
          :class="{ 'is-on': !source }"
          @click="setSource('')"
        >
          全部来源
        </button>
        <button
          v-for="c in familyCommunities"
          :key="c.id"
          type="button"
          class="joy-explore-cat"
          :class="{ 'is-on': source === c.source }"
          @click="setSource(c.source)"
        >
          {{ c.label }}
          <span class="joy-explore-cat-count">{{ c.count }}</span>
        </button>
      </div>

      <div class="joy-explore-toolbar">
        <div class="joy-explore-search-wrap">
          <input
            v-model="q"
            class="joy-explore-search"
            type="search"
            placeholder="搜索标题 / 提示词 / 标签…"
            @input="onFilter"
          />
        </div>
        <span class="joy-explore-meta">{{ shownLabel }}</span>
      </div>
    </header>

    <div class="joy-explore-pane">
      <p v-if="error" class="joy-explore-state joy-explore-error">{{ error }}</p>
      <div v-else-if="loading && !items.length" class="joy-explore-state">
        加载中…
      </div>
      <div v-else-if="!loading && !items.length" class="joy-explore-empty">
        <p class="joy-explore-empty-title">没有匹配内容</p>
        <p class="joy-explore-empty-desc">换个来源或关键词试试</p>
      </div>

      <div v-else class="joy-explore-masonry">
        <article
          v-for="it in items"
          :key="it.id"
          class="joy-explore-card"
          :style="{ aspectRatio: cardRatio(it) }"
          @click="open(it)"
        >
          <img
            v-if="it.coverUrl"
            class="joy-explore-media is-ready"
            :src="it.coverUrl"
            :alt="it.title"
            loading="lazy"
          />
          <div v-else class="joy-explore-media-fallback" />

          <span v-if="it.media === 'video'" class="joy-explore-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M8 5v14l11-7z" />
            </svg>
          </span>

          <div class="joy-explore-cover">
            <div class="joy-explore-meta-row">
              <div class="joy-explore-author">
                <span class="joy-explore-avatar">{{ authorInitial(it) }}</span>
                <span class="joy-explore-nickname">{{ it.author || it.source }}</span>
              </div>
              <div class="joy-explore-stats">
                <span v-if="it.model">{{ shortModel(it.model) }}</span>
              </div>
            </div>
            <button
              type="button"
              class="joy-explore-remix"
              @click.stop="copyAndToast(it.prompt)"
            >
              复制提示词
            </button>
          </div>
        </article>
      </div>

      <div
        v-if="items.length"
        ref="sentinelEl"
        class="joy-explore-load-more"
        aria-live="polite"
      >
        <span v-if="loadingMore">加载中…</span>
        <span v-else-if="hasMore">向下滚动加载更多</span>
        <span v-else>已加载全部 {{ filteredTotal.toLocaleString() }} 条</span>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="joy-fade">
        <div
          v-if="active"
          class="joy-explore-dialog-overlay"
          @click.self="active = null"
        >
          <div class="joy-explore-dialog" role="dialog" aria-modal="true">
            <div class="joy-explore-dialog-inner">
              <div class="joy-explore-dialog-media">
                <div class="joy-explore-dialog-stage">
                  <img
                    v-if="active.coverUrl"
                    class="joy-explore-dialog-blur"
                    :src="active.coverUrl"
                    alt=""
                  />
                  <div class="joy-explore-dialog-fg">
                    <video
                      v-if="active.videoUrl"
                      class="joy-explore-dialog-media-el"
                      :src="active.videoUrl"
                      :poster="active.coverUrl || undefined"
                      controls
                      playsinline
                    />
                    <img
                      v-else-if="active.coverUrl"
                      class="joy-explore-dialog-media-el"
                      :src="active.coverUrl"
                      :alt="active.title"
                    />
                  </div>
                </div>
              </div>

              <aside class="joy-explore-dialog-side">
                <div class="joy-explore-dialog-side-top">
                  <div class="joy-explore-dialog-user">
                    <span class="joy-explore-dialog-avatar">{{
                      authorInitial(active)
                    }}</span>
                    <div class="joy-explore-dialog-user-text">
                      <span class="joy-explore-dialog-name">{{
                        active.author || active.source || "未知作者"
                      }}</span>
                      <span v-if="active.title" class="joy-explore-dialog-handle">{{
                        active.title
                      }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="joy-explore-dialog-close"
                    aria-label="关闭"
                    @click="active = null"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4z"
                      />
                    </svg>
                  </button>
                </div>

                <div v-if="active.model || active.source" class="joy-explore-dialog-model">
                  <img
                    v-if="modelIconFor(active)"
                    class="joy-explore-dialog-model-icon"
                    :src="modelIconFor(active)"
                    alt=""
                  />
                  <span>{{ active.model || active.source }}</span>
                </div>

                <div class="joy-explore-dialog-prompt-head">
                  <span>提示词</span>
                </div>

                <div class="joy-explore-dialog-prompt">
                  {{ active.prompt || "（无提示词）" }}
                </div>

                <div
                  v-if="(active.tags || []).length"
                  class="joy-explore-dialog-tags"
                >
                  <span
                    v-for="t in (active.tags || []).slice(0, 8)"
                    :key="t"
                  >{{ t }}</span>
                </div>

                <button
                  type="button"
                  class="joy-explore-dialog-remix"
                  @click="copyAndToast(active.prompt)"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z"
                    />
                  </svg>
                  {{ copied ? "已复制" : "复制提示词" }}
                </button>
              </aside>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { withBase } from "vitepress";

function iconUrl(fileOrPath) {
  if (!fileOrPath) return "";
  const p = String(fileOrPath).replace(/^\//, "");
  return withBase(`/${p.includes("/") ? p : `brand/models/${p}`}`);
}

function resolveIcon(t) {
  return iconUrl(t.iconPath || t.icon);
}

const index = ref(null);
const cache = new Map();
const chunk = ref(0);
const q = ref("");
const source = ref("");
const familyId = ref("all");
const items = ref([]);
const filteredPool = ref([]);
const filtering = ref(false);
const loading = ref(false);
const loadingMore = ref(false);
const hasMore = ref(true);
const error = ref("");
const active = ref(null);
const copied = ref(false);
const filteredTotal = ref(0);
const sentinelEl = ref(null);

let io = null;

const sources = computed(() => index.value?.sources ?? []);
const families = computed(() => index.value?.families ?? []);

/** 本站优先用 catalogTabs；完整 tabs 留给 JoyAI */
const headerTabs = computed(() => {
  const preferred = index.value?.catalogTabs;
  if (Array.isArray(preferred) && preferred.length) return preferred;
  const tabs = index.value?.tabs ?? [];
  return tabs.filter((t) => {
    if (t.kind === "all" || t.id === "all") return true;
    if (typeof t.catalogCount === "number") return t.catalogCount > 0;
    const fam = families.value.find((f) => f.id === t.id);
    return (fam?.catalogCount ?? 0) > 0;
  });
});

const activeFamily = computed(() =>
  families.value.find((f) => f.id === familyId.value) ?? null,
);

const familyCommunities = computed(() => {
  if (familyId.value === "all" || !activeFamily.value) {
    return sources.value
      .filter((s) => (s.count ?? 0) > 0)
      .map((s) => ({
        id: s.id,
        label: s.label,
        source: s.id,
        count: s.count,
        live: false,
      }));
  }
  return (activeFamily.value.communities || []).filter(
    (c) => (c.count ?? 0) > 0,
  );
});

const shownLabel = computed(() => {
  if (!index.value) return "";
  return `${items.value.length.toLocaleString()} / ${filteredTotal.value.toLocaleString()}`;
});

function shortModel(m) {
  return String(m || "").slice(0, 18);
}

function authorInitial(it) {
  const name = String(it.author || it.source || "?").trim();
  return name.slice(0, 1).toUpperCase();
}

function modelIconFor(it) {
  const hay = `${it?.model || ""} ${it?.source || ""}`.toLowerCase();
  for (const f of families.value) {
    const hit = (f.communities || []).some((c) => c.source === it.source);
    if (hit && (f.iconPath || f.icon)) return resolveIcon(f);
  }
  if (/gpt|openai|dall/.test(hay)) return iconUrl("openai.svg");
  if (/nano|banana|gemini|pixai/.test(hay)) return iconUrl("nano-banana.svg");
  if (/seedream/.test(hay)) return iconUrl("seedream.svg");
  if (/seedance/.test(hay)) return iconUrl("seedance.svg");
  if (/grok/.test(hay)) return iconUrl("grok.svg");
  if (/kling/.test(hay)) return iconUrl("kling.svg");
  if (/midjourney|\bmj\b/.test(hay)) return iconUrl("midjourney.svg");
  if (/veo/.test(hay)) return iconUrl("veo.svg");
  if (/civitai|stability/.test(hay)) return iconUrl("stability.svg");
  return null;
}

function cardRatio(it) {
  // Mild variety like a masonry feed without measuring images
  const h = String(it.id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const ratios = ["3 / 4", "1 / 1", "4 / 5", "2 / 3", "5 / 6"];
  return ratios[h % ratios.length];
}

async function fetchJson(path) {
  const res = await fetch(withBase(`/${String(path).replace(/^\//, "")}`));
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

async function loadPageFile(name) {
  if (cache.has(name)) return cache.get(name);
  const data = await fetchJson(`data/pages/${name}.json`);
  const list = data.items || [];
  cache.set(name, list);
  return list;
}

function inFamily(it) {
  if (familyId.value === "all") return true;
  const fam = activeFamily.value;
  if (!fam) return true;
  const allow = new Set(
    (fam.communities || []).map((c) => c.source).filter(Boolean),
  );
  return allow.has(it.source);
}

function matchItem(it) {
  if (!inFamily(it)) return false;
  if (source.value && it.source !== source.value) return false;
  const needle = q.value.trim().toLowerCase();
  if (!needle) return true;
  const hay = `${it.title}\n${it.prompt}\n${(it.tags || []).join(" ")}`.toLowerCase();
  return hay.includes(needle);
}

async function ensureAllCached() {
  const names = index.value?.pages || [];
  for (const name of names) await loadPageFile(name);
}

function needsFilter() {
  return Boolean(q.value.trim() || source.value || familyId.value !== "all");
}

async function rebuildPool() {
  filtering.value = needsFilter();
  if (!filtering.value) {
    filteredPool.value = [];
    filteredTotal.value = index.value?.total || 0;
    return;
  }
  await ensureAllCached();
  const all = [];
  for (const name of index.value.pages || []) {
    for (const it of cache.get(name) || []) {
      if (matchItem(it)) all.push(it);
    }
  }
  filteredPool.value = all;
  filteredTotal.value = all.length;
}

async function loadMore() {
  if (!index.value || loadingMore.value || !hasMore.value) return;
  loadingMore.value = true;
  error.value = "";
  try {
    const size = index.value.pageSize || 50;
    const next = chunk.value;

    if (filtering.value) {
      const start = next * size;
      if (start >= filteredPool.value.length) {
        hasMore.value = false;
        return;
      }
      const slice = filteredPool.value.slice(start, start + size);
      items.value = items.value.concat(slice);
      chunk.value = next + 1;
      hasMore.value = items.value.length < filteredPool.value.length;
    } else {
      const names = index.value.pages || [];
      if (next >= names.length) {
        hasMore.value = false;
        return;
      }
      const list = await loadPageFile(names[next]);
      items.value = items.value.concat(list);
      chunk.value = next + 1;
      hasMore.value = chunk.value < names.length;
    }
  } catch (e) {
    error.value = e.message || String(e);
  } finally {
    loadingMore.value = false;
  }
}

async function resetAndLoad() {
  if (!index.value) return;
  loading.value = true;
  error.value = "";
  chunk.value = 0;
  items.value = [];
  hasMore.value = true;
  try {
    await rebuildPool();
    await loadMore();
  } catch (e) {
    error.value = e.message || String(e);
  } finally {
    loading.value = false;
    await nextTick();
    bindObserver();
  }
}

function onFilter() {
  resetAndLoad();
}

function setFamily(id) {
  familyId.value = id;
  source.value = "";
  onFilter();
}

function setSource(id) {
  source.value = id;
  onFilter();
}

function open(it) {
  active.value = it;
  copied.value = false;
}

async function copyAndToast(text) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1600);
  } catch {
    /* ignore */
  }
}

function bindObserver() {
  if (io) {
    io.disconnect();
    io = null;
  }
  if (typeof IntersectionObserver === "undefined") return;
  const el = sentinelEl.value;
  if (!el) return;
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        void loadMore();
      }
    },
    { root: null, rootMargin: "320px 0px", threshold: 0 },
  );
  io.observe(el);
}

onMounted(async () => {
  if (typeof document !== "undefined") {
    document.body.classList.add("market-page");
  }
  try {
    index.value = await fetchJson("data/index.json");
    await resetAndLoad();
  } catch (e) {
    error.value = e.message || String(e);
  }
});

onUnmounted(() => {
  if (io) {
    io.disconnect();
    io = null;
  }
});
</script>

<style scoped>
.joy-explore {
  display: flex;
  flex-direction: column;
  min-height: 70vh;
  background: var(--background);
  color: var(--foreground);
  font-family: "Geist", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.joy-explore-header {
  flex-shrink: 0;
  z-index: 30;
  padding: 22px 20px 12px;
  background: var(--background);
}

.joy-explore-tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px 22px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--border);
}

.joy-explore-tab {
  position: relative;
  height: 42px;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 16px;
  font-weight: 400;
  letter-spacing: -0.01em;
  cursor: pointer;
  font-family: inherit;
}

.joy-explore-tab:hover {
  color: var(--foreground);
}

.joy-explore-tab.is-active {
  color: var(--foreground);
}

.joy-explore-tab.is-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 999px;
  background: var(--foreground);
}

.joy-explore-tab-model {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.joy-explore-tab-model-icon {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  object-fit: contain;
  flex-shrink: 0;
}

/* Grok mark is black currentColor; invert if page ever goes dark */
.dark .joy-explore-tab-model-icon.is-mono {
  filter: invert(1);
}

.joy-explore-cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.joy-explore-cat {
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.joy-explore-cat:hover {
  background: var(--muted);
  color: var(--foreground);
}

.joy-explore-cat.is-on {
  background: var(--secondary);
  color: var(--secondary-foreground);
}

.joy-explore-cat-count {
  font-size: 11px;
  opacity: 0.55;
}

.joy-explore-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.joy-explore-search-wrap {
  flex: 1 1 220px;
  min-width: 180px;
}

.joy-explore-search {
  width: 100%;
  box-sizing: border-box;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
  font: inherit;
  font-size: 13px;
  outline: none;
}

.joy-explore-search:focus {
  border-color: color-mix(in oklab, var(--ring) 70%, var(--border));
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 28%, transparent);
}

.joy-explore-meta {
  font-size: 13px;
  color: var(--muted-foreground);
  font-variant-numeric: tabular-nums;
}

.joy-explore-pane {
  padding: 0 20px 64px;
}

.joy-explore-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: min(40vh, 280px);
  color: var(--muted-foreground);
  font-size: 14px;
}

.joy-explore-error {
  color: #dc2626;
}

.joy-explore-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: min(40vh, 320px);
  padding: 48px 24px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 24px;
  background: var(--muted);
}

.joy-explore-empty-title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 400;
}

.joy-explore-empty-desc {
  margin: 0;
  font-size: 13px;
  color: var(--muted-foreground);
}

/* CSS multi-column masonry (JoyAI uses react-masonry-css) */
.joy-explore-masonry {
  column-count: 2;
  column-gap: 12px;
}

@media (min-width: 720px) {
  .joy-explore-masonry {
    column-count: 3;
  }
}

@media (min-width: 960px) {
  .joy-explore-masonry {
    column-count: 4;
  }
}

@media (min-width: 1200px) {
  .joy-explore-masonry {
    column-count: 5;
  }
}

@media (min-width: 1440px) {
  .joy-explore-masonry {
    column-count: 6;
  }
}

.joy-explore-card {
  position: relative;
  display: inline-block;
  width: 100%;
  margin: 0 0 12px;
  overflow: hidden;
  border-radius: calc(var(--radius) + 2px);
  background: var(--muted);
  border: 1px solid var(--border);
  cursor: pointer;
  break-inside: avoid;
  contain: layout paint;
}

.joy-explore-media {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s var(--joy-ease-out);
}

.joy-explore-media-fallback {
  position: absolute;
  inset: 0;
  background: var(--muted);
}

.joy-explore-card:hover .joy-explore-media {
  transform: scale(1.03);
}

.joy-explore-play {
  pointer-events: none;
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  display: inline-flex;
  height: 28px;
  width: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in oklab, var(--background) 55%, transparent);
  color: #fff;
  backdrop-filter: blur(6px);
  box-shadow: 0 0 0 1px color-mix(in oklab, #fff 18%, transparent);
}

.joy-explore-cover {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px;
  background: linear-gradient(
    180deg,
    transparent 35%,
    rgba(0, 0, 0, 0.28) 58%,
    rgba(0, 0, 0, 0.72) 100%
  );
  opacity: 0;
  transition: opacity 0.2s ease;
}

.joy-explore-card:hover .joy-explore-cover {
  opacity: 1;
}

.joy-explore-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.joy-explore-author {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  max-width: 58%;
  min-width: 0;
}

.joy-explore-avatar {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 600;
  background: color-mix(in oklab, #fff 25%, transparent);
}

.joy-explore-nickname {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.joy-explore-stats {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.joy-explore-remix {
  pointer-events: auto;
  display: inline-flex;
  width: 100%;
  height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in oklab, var(--card) 82%, transparent);
  color: var(--card-foreground);
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 6px 16px color-mix(in oklab, #000 22%, transparent);
  transition: background 0.15s, transform 0.15s;
  font-family: inherit;
}

.joy-explore-remix:hover {
  background: var(--card);
  transform: translateY(-1px);
}

.joy-explore-load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 0 8px;
  font-size: 13px;
  color: var(--muted-foreground);
}

/* Detail dialog — JoyAI explore detail (single copy CTA) */
.joy-explore-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: color-mix(in oklab, #000 28%, transparent);
}

.joy-explore-dialog {
  --explore-dialog-w: min(1080px, calc(100vw - 32px));
  --explore-dialog-h: min(720px, calc(100vh - 48px));
  --explore-dialog-side: 360px;
  position: relative;
  width: var(--explore-dialog-w);
  height: var(--explore-dialog-h);
  max-width: var(--explore-dialog-w);
  max-height: var(--explore-dialog-h);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) + 6px);
  background: var(--card);
  box-shadow: 0 28px 80px color-mix(in oklab, #000 35%, transparent);
  overflow: hidden;
  color: var(--foreground);
}

.joy-explore-dialog-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--explore-dialog-side);
  width: 100%;
  height: 100%;
}

@media (max-width: 860px) {
  .joy-explore-dialog {
    --explore-dialog-w: min(100vw - 16px, 560px);
    --explore-dialog-h: min(100vh - 24px, 820px);
    --explore-dialog-side: auto;
  }
  .joy-explore-dialog-inner {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(240px, 46%) minmax(0, 1fr);
  }
}

.joy-explore-dialog-media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 16px;
  background: var(--muted);
  overflow: hidden;
}

.joy-explore-dialog-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: calc(var(--radius) + 2px);
  overflow: hidden;
  background: color-mix(in oklab, var(--background) 80%, #000 20%);
}

.joy-explore-dialog-blur {
  position: absolute;
  inset: -12%;
  z-index: 0;
  width: 124%;
  height: 124%;
  object-fit: cover;
  filter: blur(36px) saturate(1.15) brightness(0.72);
  transform: scale(1.08);
  pointer-events: none;
  user-select: none;
}

.joy-explore-dialog-fg {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.joy-explore-dialog-media-el {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: calc(var(--radius));
  box-shadow: 0 12px 40px color-mix(in oklab, #000 28%, transparent);
}

.joy-explore-dialog-side {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 20px 20px 18px;
  color: var(--card-foreground);
  background: var(--card);
  border-left: 1px solid var(--border);
  overflow: hidden;
}

@media (max-width: 860px) {
  .joy-explore-dialog-side {
    border-left: 0;
    border-top: 1px solid var(--border);
  }
  .joy-explore-dialog-media {
    padding: 12px;
  }
}

.joy-explore-dialog-side-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.joy-explore-dialog-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.joy-explore-dialog-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 600;
  background: var(--muted);
  color: var(--foreground);
}

.joy-explore-dialog-user-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.joy-explore-dialog-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--foreground);
}

.joy-explore-dialog-handle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--muted-foreground);
}

.joy-explore-dialog-close {
  display: inline-flex;
  height: 34px;
  width: 34px;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: color-mix(in oklab, var(--card) 88%, transparent);
  color: var(--foreground);
  cursor: pointer;
  transition: background 0.15s ease;
}

.joy-explore-dialog-close:hover {
  background: var(--muted);
}

.joy-explore-dialog-model {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  height: 28px;
  margin-bottom: 14px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--secondary);
  color: var(--secondary-foreground);
  font-size: 12px;
  font-weight: 500;
  flex-shrink: 0;
}

.joy-explore-dialog-model-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  border-radius: 3px;
}

.joy-explore-dialog-prompt-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--muted-foreground);
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
}

.joy-explore-dialog-prompt {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-bottom: 12px;
  padding-right: 4px;
  color: var(--foreground);
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}

.joy-explore-dialog-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.joy-explore-dialog-tags span {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--secondary);
  color: var(--muted-foreground);
}

.joy-explore-dialog-remix {
  display: inline-flex;
  width: 100%;
  height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: calc(var(--radius));
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  font-family: inherit;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.joy-explore-dialog-remix:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.joy-fade-enter-active,
.joy-fade-leave-active {
  transition: opacity 0.2s ease;
}
.joy-fade-enter-from,
.joy-fade-leave-to {
  opacity: 0;
}
.joy-fade-enter-active .joy-explore-dialog,
.joy-fade-leave-active .joy-explore-dialog {
  transition: transform 0.22s var(--joy-ease-out), opacity 0.2s ease;
}
.joy-fade-enter-from .joy-explore-dialog,
.joy-fade-leave-to .joy-explore-dialog {
  transform: translateY(8px) scale(0.985);
  opacity: 0;
}
</style>
