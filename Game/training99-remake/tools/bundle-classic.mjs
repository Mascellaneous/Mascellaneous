/**
 * Rebuild the file://-compatible release script from the small source files.
 * Uses only Node.js built-ins and produces js/game.js with no import/export.
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const releaseDirectory = resolve(process.argv[2] ?? ".");
const sourceFiles = ["config.js", "input.js", "renderer.js", "game.js"];

function toClassicScript(source) {
  return source
    .replace(/^import\s.+?;\s*$/gm, "")
    .replace(/\bexport\s+(?=(const|function|class)\b)/g, "");
}

const source = await Promise.all(
  sourceFiles.map(async (name) => {
    const content = await readFile(resolve(releaseDirectory, "src", name), "utf8");
    return `\n/* ===== ${name} ===== */\n${toClassicScript(content)}`;
  }),
);

const banner = `/*\n * 特訓99｜零依賴 file:// 發布檔\n * 由原始小型模組合併而成；不含 import 或外部執行期依賴。\n */\n`;
await writeFile(resolve(releaseDirectory, "js", "game.js"), banner + source.join("\n"), "utf8");
