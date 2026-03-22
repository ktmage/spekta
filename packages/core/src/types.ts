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
  analyzer: {
    rspec?: {
      spec_types: string[];
    };
    vitest?: {
      spec_dir?: string;
      exclude?: string[];
    };
  };
  renderer: {
    web?: RendererWebConfig;
    markdown?: RendererMarkdownConfig;
    pdf?: RendererPdfConfig;
  };
}

export interface RendererWebConfig {
  name?: string;
  description?: string;
  path?: string;
}

export interface RendererMarkdownConfig {
  path?: string;
}

export interface RendererPdfConfig {
  path?: string;
}
