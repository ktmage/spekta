import type { IR } from "./schema.js";

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
  export(ir: IR, config: Record<string, unknown>, outputDir: string): void;
}
