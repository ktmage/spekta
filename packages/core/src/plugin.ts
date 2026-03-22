import type { IR, SiteInfo } from "./schema.js";

// --- Annotator Plugin ---

export interface Annotation {
  line: number;
  type: string;
  text: string;
}

export interface AnnotatorPlugin {
  name: string;
  filePatterns: string[];
  annotate(filePath: string, source: string): Annotation[];
}

// --- Exporter Plugin ---

export interface ExporterPlugin {
  name: string;
  export(ir: IR, config: Record<string, unknown>, outputDir: string, siteInfo?: SiteInfo): void;
}

// --- Plugin Resolution ---

export function resolveExporter(name: string): ExporterPlugin {
  // Try to resolve from node_modules
  // Supports: "@spekta/exporter-web" or short form "web" → "@spekta/exporter-web"
  const packageName = name.startsWith("@") ? name : `@spekta/exporter-${name}`;

  try {
    const mod = require(packageName);
    if (mod && typeof mod.default === "object" && typeof mod.default.export === "function") {
      return mod.default as ExporterPlugin;
    }
    if (mod && typeof mod.export === "function") {
      return mod as ExporterPlugin;
    }
    throw new Error(`Plugin ${packageName} does not export a valid ExporterPlugin`);
  } catch (err: any) {
    throw new Error(`Failed to load exporter plugin "${packageName}": ${err.message}`);
  }
}

export function resolveAnnotator(name: string): AnnotatorPlugin {
  const packageName = name.startsWith("@") ? name : `@spekta/annotator-${name}`;

  try {
    const mod = require(packageName);
    if (mod && typeof mod.default === "object" && typeof mod.default.annotate === "function") {
      return mod.default as AnnotatorPlugin;
    }
    if (mod && typeof mod.annotate === "function") {
      return mod as AnnotatorPlugin;
    }
    throw new Error(`Plugin ${packageName} does not export a valid AnnotatorPlugin`);
  } catch (err: any) {
    throw new Error(`Failed to load annotator plugin "${packageName}": ${err.message}`);
  }
}
