/**
 * JoyAI-aligned explore header: tabs + communities.
 * Written into data/families.json and index.families by import / build-families.
 */
export const EXPLORE_TABS = [
  {
    id: "all",
    label: "全部",
    icon: null,
    mono: false,
    kind: "all",
  },
];

/** Same order / ids as JoyAI `explore-home.tsx` MODEL_FAMILIES. */
export const MODEL_FAMILIES = [
  {
    id: "gpt-image",
    label: "GPT Image 2",
    icon: "openai.svg",
    iconName: "GPT Image",
    mono: false,
    communities: [
      { id: "youmind", label: "YouMind", source: "youmind-gpt-image-2" },
      { id: "xianyu", label: "咸鱼", source: "xianyu-awesome-gptimage2" },
      { id: "awesome", label: "Awesome GPT Image", source: "awesome-gpt-image" },
      {
        id: "gpt4o",
        label: "GPT-4o Prompts",
        source: "awesome-gpt4o-image-prompts",
      },
      { id: "davidwu", label: "DavidWu", source: "davidwu-gpt-image2-prompts" },
      {
        id: "prompts",
        label: "Awesome GPT Image 2",
        source: "gpt-image-2-prompts",
      },
      {
        id: "multi",
        label: "image-prompt-generator",
        source: "xianyu-multi-model",
      },
    ],
  },
  {
    id: "seedream",
    label: "Seedream",
    icon: "seedream.svg",
    iconName: "Seedream",
    mono: false,
    communities: [
      { id: "youmind", label: "YouMind Seedream", source: "youmind-seedream-4.5" },
    ],
  },
  {
    id: "nano-banana",
    label: "Nano Banana",
    icon: "nano-banana.svg",
    iconName: "Nano Banana",
    mono: false,
    communities: [
      {
        id: "youmind",
        label: "YouMind Nano Banana",
        source: "youmind-nano-banana-pro",
      },
      { id: "gemini3", label: "YouMind Gemini 3", source: "youmind-gemini-3" },
      { id: "quicker", label: "Banana Quicker", source: "banana-prompt-quicker" },
    ],
  },
  {
    id: "seedance",
    label: "Seedance",
    icon: "seedance.svg",
    iconName: "Seedance",
    mono: false,
    communities: [
      { id: "youmind", label: "YouMind Seedance", source: "youmind-seedance-2" },
      { id: "gallery", label: "Seedance 画廊", source: "ericgood-seedance" },
      // live / not in static import — kept for JoyAI header parity
      { id: "domer", label: "Domer", source: "domer-seedance", live: true },
    ],
  },
  {
    id: "kling",
    label: "Kling",
    icon: "kling.svg",
    iconName: "Kling",
    mono: false,
    communities: [
      { id: "domer", label: "Domer Kling", source: "domer-kling", live: true },
    ],
  },
  {
    id: "midjourney",
    label: "Midjourney",
    icon: "midjourney.svg",
    iconName: "Midjourney",
    mono: true,
    communities: [],
  },
  {
    id: "grok",
    label: "Grok Imagine",
    icon: "grok.svg",
    iconName: "Grok",
    mono: true,
    communities: [
      {
        id: "youmind",
        label: "YouMind Grok Imagine",
        source: "youmind-grok-imagine",
      },
      { id: "domer", label: "Domer Grok", source: "domer-grok", live: true },
    ],
  },
  {
    id: "veo",
    label: "Veo",
    icon: "veo.svg",
    iconName: "Veo",
    mono: false,
    communities: [
      { id: "domer", label: "Domer Veo", source: "domer-veo", live: true },
    ],
  },
  {
    id: "civitai",
    label: "Civitai",
    icon: "stability.svg",
    iconName: "Stability",
    mono: false,
    communities: [
      { id: "hot", label: "Highest Rated", source: "civitai-hot", live: true },
      {
        id: "download",
        label: "Most Downloaded",
        source: "civitai-download",
        live: true,
      },
      { id: "lora", label: "LoRA", source: "civitai-lora", live: true },
      { id: "newest", label: "Newest", source: "civitai-newest", live: true },
    ],
  },
  {
    id: "pixai",
    label: "PixAI",
    icon: "nano-banana.svg",
    iconName: "Nano Banana",
    mono: false,
    communities: [
      { id: "hot", label: "热门模型", source: "pixai-hot", live: true },
      { id: "newest", label: "最新", source: "pixai-newest", live: true },
    ],
  },
];

/**
 * @param {Array<{ id: string, label?: string, count?: number }>} sources
 * @param {{ iconBase?: string }} [opts]
 */
export function buildFamiliesPayload(sources, opts = {}) {
  const iconBase = opts.iconBase || "brand/models";
  const countById = new Map(
    (sources || []).map((s) => [s.id, Number(s.count) || 0]),
  );

  const families = MODEL_FAMILIES.map((f) => {
    const communities = (f.communities || []).map((c) => {
      const count = countById.has(c.source) ? countById.get(c.source) : 0;
      return {
        id: c.id,
        label: c.label,
        source: c.source,
        live: Boolean(c.live),
        count,
      };
    });
    const catalogCount = communities.reduce(
      (sum, c) => sum + (c.live ? 0 : c.count),
      0,
    );
    return {
      id: f.id,
      label: f.label,
      icon: f.icon,
      iconName: f.iconName,
      iconPath: f.icon ? `${iconBase}/${f.icon}` : null,
      mono: Boolean(f.mono),
      catalogCount,
      communities,
    };
  });

  const tabs = [
    ...EXPLORE_TABS.map((t) => ({
      id: t.id,
      label: t.label,
      icon: null,
      iconPath: null,
      mono: false,
      kind: "all",
    })),
    ...families.map((f) => ({
      id: f.id,
      label: f.label,
      icon: f.icon,
      iconPath: f.iconPath,
      mono: f.mono,
      kind: "family",
      catalogCount: f.catalogCount,
    })),
  ];

  /** 静态站可用的 Tab（有语料）；JoyAI 仍用完整 tabs 接 live */
  const catalogTabs = tabs.filter(
    (t) => t.kind === "all" || (t.catalogCount ?? 0) > 0,
  );

  return {
    schemaVersion: 1,
    iconBase,
    tabs,
    catalogTabs,
    families,
  };
}
