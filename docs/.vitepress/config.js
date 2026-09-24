import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "Joy Prompt Catalog",
  description: "提示词语料仓：提示词 + 图/视频链接",
  appearance: false,
  // GitHub project pages: must match repo name (joy-prompt-catalog)
  base: process.env.GITHUB_ACTIONS ? "/joy-prompt-catalog/" : "/",
  head: [
    ["link", { rel: "icon", href: "/favicon.png", type: "image/png" }],
    ["link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }],
    [
      "link",
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
    ],
    [
      "link",
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossorigin: "",
      },
    ],
  ],
  themeConfig: {
    logo: "/logo.png",
    siteTitle: "Joy Prompt",
    nav: [{ text: "数据说明", link: "/schema" }],
    socialLinks: [],
    sidebar: false,
  },
});
