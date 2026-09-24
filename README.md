# Joy Prompt Catalog

独立提示词语料仓：结构化 JSON + VitePress 画廊。不耦合 JoyAI 主仓。

> 展示站用 **VitePress**（VuePress 团队后继；VuePress 2 RC 依赖链在本地装不通）。语料仍是手写/导入的 `data/`，无需打包。

## 本地

```bash
npm install
npm run import      # 从上游静态源重新拉取并写入 data/
npm run families    # 只刷新探索头部 tabs/families（不重拉语料）
npm run docs:dev    # http://localhost:5173/
```

## 数据

- 真源：[`data/`](./data/)
- 索引：`data/index.json`（含 `tabs` / `families` / `iconBase`，供 JoyAI 动态渲染探索头）
- 头部：`data/families.json`
- 图标：`data/brand/models/*.svg`
- 分页：`data/pages/0001.json` …（每页 50 条）
- 按源：`data/by-source/<source-id>.json`

CDN 示例（把 `<user>` 换成你的 GitHub 用户名）：

```text
https://cdn.jsdelivr.net/gh/<user>/joy-prompt-catalog@main/data/index.json
https://cdn.jsdelivr.net/gh/<user>/joy-prompt-catalog@main/data/families.json
https://cdn.jsdelivr.net/gh/<user>/joy-prompt-catalog@main/data/brand/models/openai.svg
https://cdn.jsdelivr.net/gh/<user>/joy-prompt-catalog@main/data/pages/0001.json
```

字段说明见 [schema.md](./schema.md)。

## 已导入来源

来自 JoyAI 探索「提示词库」静态源（不含 Domer / Civitai / PixAI 实时市场）：

| 来源 id | 说明 |
|---------|------|
| gpt-image-2-prompts | yukkcat / freestylefly |
| awesome-gpt-image | yukkcat |
| awesome-gpt4o-image-prompts | yukkcat |
| xianyu-awesome-gptimage2 | 咸鱼 latest-prompts |
| youmind-gpt-image-2 | yukkcat |
| youmind-nano-banana-pro | yukkcat |
| davidwu-gpt-image2-prompts | yukkcat |
| banana-prompt-quicker | yukkcat |
| xianyu-multi-model | image-prompt-generator |
| youmind-seedance-2 | YouMind README |
| youmind-seedream-4.5 | YouMind README |
| youmind-grok-imagine | YouMind README |
| youmind-gemini-3 | YouMind README |
| ericgood-seedance | Seedance 画廊 JSON |

条目版权归上游；`license` 标为 `upstream`，请遵守各仓库协议。

## 加一条

编辑当前页 JSON 或追加新页，更新 `index.json` 的 `total` / `pages`，然后 push。

## 部署与同步

| Workflow | 作用 |
|----------|------|
| `.github/workflows/pages.yml` | push `main`/`master` 或手动 → 构建 VitePress → 推到 `gh-pages`（同 joyWiki） |
| `.github/workflows/sync-import.yml` | 每天定时 / 手动 → `npm run import` → 有变更则 commit `data/` 并 push（再触发部署） |

本地构建：

```bash
npm run docs:build   # 输出 docs/.vitepress/dist
```

GitHub Pages：Settings → Pages → **Deploy from a branch** → `gh-pages` / `/ (root)`。
站点路径为 `/joy-prompt-catalog/`（见 `docs/.vitepress/config.js` 的 `base`）。
