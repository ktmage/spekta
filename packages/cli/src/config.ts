import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import type { SpektaConfig } from "./types.js";

/**
 * Load and parse .spekta.yml from the current working directory (or a given root).
 * Applies defaults for all optional fields.
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

  // spec_dir
  const specDir = typeof raw.spec_dir === "string" ? raw.spec_dir : "spec/";

  // analyzer.rspec.spec_types
  const analyzerRaw = raw.analyzer as Record<string, unknown> | undefined;
  const rspecRaw = analyzerRaw?.rspec as Record<string, unknown> | undefined;
  const specTypes = Array.isArray(rspecRaw?.spec_types)
    ? (rspecRaw.spec_types as string[])
    : ["feature_spec", "system_spec"];

  // renderer configs
  const rendererRaw = raw.renderer as Record<string, unknown> | undefined;

  // renderer.web
  const webRaw = rendererRaw?.web as Record<string, unknown> | undefined;
  const defaultName = path.basename(projectRoot);
  const webConfig = webRaw !== undefined
    ? {
        name: typeof webRaw.name === "string" ? webRaw.name : defaultName,
        description: typeof webRaw.description === "string" ? webRaw.description : undefined,
        path: typeof webRaw.path === "string" ? webRaw.path : ".spekta/web",
      }
    : undefined;

  // renderer.markdown
  const markdownRaw = rendererRaw?.markdown as Record<string, unknown> | undefined;
  const markdownConfig = markdownRaw !== undefined
    ? {
        path: typeof markdownRaw.path === "string" ? markdownRaw.path : ".spekta/markdown",
      }
    : undefined;

  // renderer.pdf
  const pdfRaw = rendererRaw?.pdf as Record<string, unknown> | undefined;
  const pdfConfig = pdfRaw !== undefined
    ? {
        path: typeof pdfRaw.path === "string" ? pdfRaw.path : ".spekta/pdf",
      }
    : undefined;

  // analyzer.vitest
  const vitestRaw = analyzerRaw?.vitest as Record<string, unknown> | undefined;
  const vitestConfig = vitestRaw !== undefined
    ? {
        spec_dir: typeof vitestRaw.spec_dir === "string" ? vitestRaw.spec_dir : undefined,
      }
    : undefined;

  return {
    spec_dir: specDir,
    analyzer: {
      rspec: rspecRaw !== undefined ? { spec_types: specTypes } : undefined,
      vitest: vitestConfig,
    },
    renderer: {
      web: webConfig,
      markdown: markdownConfig,
      pdf: pdfConfig,
    },
  };
}
