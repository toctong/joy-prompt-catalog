/**
 * Rebuild data/families.json + patch index.json.families / tabs from current sources.
 * Does not re-fetch upstream prompts.
 */
import { readFile, writeFile, cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFamiliesPayload } from "./families-def.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "data");

async function main() {
  const indexPath = join(DATA, "index.json");
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  const sources = index.sources || [];
  const payload = buildFamiliesPayload(sources, { iconBase: "brand/models" });

  index.schemaVersion = Math.max(Number(index.schemaVersion) || 1, 2);
  index.tabs = payload.tabs;
  index.catalogTabs = payload.catalogTabs;
  index.families = payload.families;
  index.iconBase = payload.iconBase;

  await writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");
  await writeFile(
    join(DATA, "families.json"),
    JSON.stringify(payload, null, 2),
    "utf8",
  );

  // Keep VitePress public icons in sync with data/brand
  const brandSrc = join(DATA, "brand");
  const brandDest = join(ROOT, "docs", "public", "brand");
  await mkdir(brandDest, { recursive: true });
  await cp(brandSrc, brandDest, { recursive: true });

  console.log(
    `families: ${payload.families.length} · tabs: ${payload.tabs.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
