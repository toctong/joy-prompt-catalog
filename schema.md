# 条目字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 全局唯一，形如 `sourceId:localId` |
| title | string | 标题 |
| prompt | string | 提示词正文 |
| media | `image` \| `video` | 媒体类型 |
| model | string \| null | 模型标识 |
| coverUrl | string | 封面图 URL |
| videoUrl | string \| null | 视频 URL（可空） |
| tags | string[] | 标签 |
| author | string | 作者 |
| source | string | 来源 id（对应 `sources.json`） |
| sourceUrl | string | 上游主页或原帖 |
| license | string | 默认 `upstream` |
| createdAt | string \| null | ISO 时间（可空） |

## index.json（schemaVersion ≥ 2）

```json
{
  "schemaVersion": 2,
  "total": 5646,
  "pageSize": 50,
  "pages": ["0001", "0002"],
  "models": [],
  "sources": [{ "id": "…", "label": "…", "count": 0 }],
  "iconBase": "brand/models",
  "tabs": [
    { "id": "all", "label": "全部", "icon": null, "iconPath": null, "kind": "all" },
    {
      "id": "gpt-image",
      "label": "GPT Image 2",
      "icon": "openai.svg",
      "iconPath": "brand/models/openai.svg",
      "mono": false,
      "kind": "family",
      "catalogCount": 123
    }
  ],
  "families": [
    {
      "id": "gpt-image",
      "label": "GPT Image 2",
      "icon": "openai.svg",
      "iconPath": "brand/models/openai.svg",
      "iconName": "GPT Image",
      "mono": false,
      "catalogCount": 123,
      "communities": [
        {
          "id": "youmind",
          "label": "YouMind",
          "source": "youmind-gpt-image-2",
          "live": false,
          "count": 126
        }
      ]
    }
  ]
}
```

独立文件：[`data/families.json`](./data/families.json)（与 `index.tabs` / `index.families` 同结构）。

- `tabs`：完整头部（含 live 空 Tab），供 JoyAI
- `catalogTabs`：仅有静态语料的 Tab，供本站画廊

### JoyAI 消费头部

1. 拉 `data/index.json` 或 `data/families.json`
2. 用 `tabs` 渲染顶栏（含 `iconPath`）
3. 选中 family 后用对应 `families[].communities` 渲染第二行胶囊
4. 图标 URL：`https://cdn.jsdelivr.net/gh/<user>/joyPromptCatalog@main/data/<iconPath>`
5. `live: true` 且 `count: 0` 表示实时市场源（本仓未静态收录），JoyAI 可走原有 live 代理

## 重建头部

```bash
npm run families   # 不重拉语料，只刷新 tabs/families
npm run import     # 全量导入时也会写 families
```
