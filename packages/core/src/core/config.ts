import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import type { SpektaConfig } from "../schema/types.js";

/**
 * Load and parse .spekta.yml from the current working directory (or a given root).
 */
export function loadConfig(root?: string): SpektaConfig {
  const projectRoot = root ?? process.cwd();
  const configPath = path.join(projectRoot, ".spekta.yml");

  let rawConfig: Record<string, unknown> = {};

  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf-8");
    rawConfig = (parseYaml(content) as Record<string, unknown>) ?? {};
  } else {
    console.warn(`Warning: .spekta.yml not found at ${configPath}. Using defaults.`);
  }

  const raw = rawConfig as Record<string, unknown>;

  return {
    target_dir: typeof raw.target_dir === "string" ? raw.target_dir : ".",
    include: Array.isArray(raw.include) ? raw.include as string[] : undefined,
    exclude: Array.isArray(raw.exclude) ? raw.exclude as string[] : undefined,
    annotator: raw.annotator as SpektaConfig["annotator"],
    exporter: raw.exporter as SpektaConfig["exporter"],
  };
}
