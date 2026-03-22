import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import type { SpektaConfig } from "../schema/types.js";

/**
 * Load and parse .spekta.yml from the current working directory (or a given root).
 * Supports both new format (annotator/exporter) and legacy format (analyzer/renderer).
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
  const specDir = typeof raw.spec_dir === "string" ? raw.spec_dir : "spec/";
  const defaultName = path.basename(projectRoot);

  // --- Annotator (new format) ---
  const annotatorRaw = raw.annotator as Record<string, unknown> | undefined;

  // --- Exporter (new format) ---
  const exporterRaw = raw.exporter as Record<string, unknown> | undefined;

  // --- Legacy: analyzer ---
  const analyzerRaw = raw.analyzer as Record<string, unknown> | undefined;
  const rspecRaw = analyzerRaw?.rspec as Record<string, unknown> | undefined;
  const specTypes = Array.isArray(rspecRaw?.spec_types)
    ? (rspecRaw.spec_types as string[])
    : ["feature_spec", "system_spec"];
  const vitestRaw = analyzerRaw?.vitest as Record<string, unknown> | undefined;
  const vitestConfig = vitestRaw !== undefined
    ? {
        spec_dir: typeof vitestRaw.spec_dir === "string" ? vitestRaw.spec_dir : undefined,
        exclude: Array.isArray(vitestRaw.exclude) ? vitestRaw.exclude as string[] : undefined,
      }
    : undefined;

  // --- Legacy: renderer / New: exporter ---
  const rendererRaw = (raw.renderer ?? exporterRaw) as Record<string, unknown> | undefined;

  const webRaw = rendererRaw?.web as Record<string, unknown> | undefined;
  const webConfig = webRaw !== undefined
    ? {
        name: typeof webRaw.name === "string" ? webRaw.name : defaultName,
        description: typeof webRaw.description === "string" ? webRaw.description : undefined,
        path: typeof webRaw.path === "string" ? webRaw.path : ".spekta/web",
      }
    : undefined;

  const markdownRaw = rendererRaw?.markdown as Record<string, unknown> | undefined;
  const markdownConfig = markdownRaw !== undefined
    ? { path: typeof markdownRaw.path === "string" ? markdownRaw.path : ".spekta/markdown" }
    : undefined;

  const pdfRaw = rendererRaw?.pdf as Record<string, unknown> | undefined;
  const pdfConfig = pdfRaw !== undefined
    ? { path: typeof pdfRaw.path === "string" ? pdfRaw.path : ".spekta/pdf" }
    : undefined;

  return {
    spec_dir: specDir,
    annotator: annotatorRaw as SpektaConfig["annotator"],
    exporter: exporterRaw as SpektaConfig["exporter"],
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
