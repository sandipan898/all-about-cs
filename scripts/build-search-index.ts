import fs from "node:fs";
import path from "node:path";
import { generateSearchIndex } from "../src/lib/search-index";

const outDir = path.join(process.cwd(), "public");
const outPath = path.join(outDir, "search-index.json");

const index = generateSearchIndex();

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(outPath, JSON.stringify(index), "utf-8");
console.log(`Wrote search index: ${outPath} (${index.length} entries)`);
