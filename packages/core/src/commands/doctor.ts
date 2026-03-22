import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "../core/config.js";

export function doctor(): void {
  console.log("Spekta Doctor\n");

  let ok = true;

  ok = check("Node.js", () => {
    return { ok: true, detail: process.version };
  }) && ok;

  ok = check(".spekta.yml", () => {
    if (fs.existsSync(".spekta.yml")) {
      return { ok: true, detail: "found" };
    }
    return { ok: false, detail: "not found" };
  }) && ok;

  if (!fs.existsSync(".spekta.yml")) {
    console.log("\n  .spekta.yml が見つかりません。以降のチェックをスキップします。");
    process.exit(1);
  }

  const config = loadConfig();

  ok = check("target_dir", () => {
    const targetDir = path.resolve(config.target_dir);
    if (fs.existsSync(targetDir)) {
      return { ok: true, detail: targetDir };
    }
    return { ok: false, detail: `${targetDir} not found` };
  }) && ok;

  // Check annotator plugins
  if (config.annotator) {
    for (const annotatorName of Object.keys(config.annotator)) {
      ok = check(`annotator: ${annotatorName}`, () => {
        try {
          const { createRequire } = require("node:module");
          const localRequire = createRequire(path.resolve("package.json"));
          localRequire.resolve(annotatorName);
          return { ok: true, detail: "installed" };
        } catch {
          return { ok: false, detail: "not found. Run: npm install " + annotatorName };
        }
      }) && ok;
    }
  }

  // Check exporter plugins
  const exporterConfig = config.exporter ?? config.renderer;
  if (exporterConfig) {
    for (const exporterName of Object.keys(exporterConfig)) {
      ok = check(`exporter: ${exporterName}`, () => {
        const exporterDir = path.resolve(
          import.meta.dirname ?? ".",
          `../../../exporters/${exporterName}/dist/render.js`,
        );
        if (fs.existsSync(exporterDir)) {
          return { ok: true, detail: "built" };
        }
        return { ok: false, detail: "not built. Run: cd packages/exporters/" + exporterName + " && bun run build" };
      }) && ok;
    }
  }

  console.log("");
  if (ok) {
    console.log("All checks passed.");
  } else {
    console.log("Some checks failed. Fix the issues above.");
    process.exit(1);
  }
}

function check(name: string, fn: () => { ok: boolean; detail: string }): boolean {
  const result = fn();
  const icon = result.ok ? "+" : "x";
  console.log(`  [${icon}] ${name}: ${result.detail}`);
  return result.ok;
}
