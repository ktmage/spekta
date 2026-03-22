// Re-export all types from schema.ts for backward compatibility
export type {
  Step,
  Attribute,
  Section,
  Page,
  IR as BehaviorIR,
  SiteInfo,
} from "./schema.js";

// Config types (not part of IR schema)

export interface SpektaConfig {
  spec_dir: string;
  // New format
  annotator?: Record<string, Record<string, unknown> | null>;
  exporter?: Record<string, Record<string, unknown> | null>;
  // Legacy format (backward compatible)
  analyzer: {
    rspec?: { spec_types: string[] };
    vitest?: { spec_dir?: string; exclude?: string[] };
  };
  renderer: {
    web?: ExporterWebConfig;
    markdown?: ExporterMarkdownConfig;
    pdf?: ExporterPdfConfig;
  };
}

export interface ExporterWebConfig {
  name?: string;
  description?: string;
  path?: string;
}

export interface ExporterMarkdownConfig {
  path?: string;
}

export interface ExporterPdfConfig {
  path?: string;
}
