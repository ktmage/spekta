import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import { spektaConfigSchema, type SpektaConfig } from "../schema/config.js";

/**
 * Load and parse .spekta.yml from the current working directory (or a given root).
 */
export function loadConfig(root?: string): SpektaConfig {
  const projectRoot = root ?? process.cwd();
  const configPath = path.join(projectRoot, ".spekta.yml");

  let rawConfig: unknown = {};

  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf-8");
    rawConfig = parseYaml(content) ?? {};
  } else {
    console.warn(`Warning: .spekta.yml not found at ${configPath}. Using defaults.`);
  }

  return spektaConfigSchema.parse(rawConfig);
}
