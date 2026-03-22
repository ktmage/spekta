import type { IR } from "./ir.js";
import type { SpektaConfig } from "./types.js";
export type { SpektaConfig } from "./types.js";

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
  defaultOutputDir: string;
  configSchema?: { parse(data: unknown): unknown };
  export(ir: IR, config: Record<string, unknown>, outputDir: string): void;
  commands?: Record<string, (config: SpektaConfig) => Promise<void>>;
}
