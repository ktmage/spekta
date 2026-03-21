// ============================================================
// Spekta Behavior IR types
// Matches the schema defined in packages/ir/behavior.schema.json
// ============================================================

/**
 * Root IR document representing the full behavior specification.
 */
export interface BehaviorIR {
  version: string;
  pages: Page[];
}

/**
 * A document unit representing a specification page.
 */
export interface Page {
  id: string;
  type: string;
  title: string;
  attributes?: Attribute[];
  sections?: Section[];
}

/**
 * A section within a page. Sections can nest recursively and may contain steps.
 */
export interface Section {
  id: string;
  title: string;
  attributes?: Attribute[];
  sections?: Section[];
  steps?: Step[];
}

/**
 * Metadata attached to a page or section.
 */
export interface Attribute {
  type: "summary" | "why" | "see" | "image" | "graph";
  text?: string;
  ref?: string;
}

/**
 * A single action or assertion within a section.
 */
export interface Step {
  action: "visit" | "click_on" | "fill_in" | "select" | "expect" | "other";
  target: string;
  value?: string;
}

/**
 * Site information (separate from IR, renderer-specific).
 */
export interface SiteInfo {
  name?: string;
  description?: string;
  builtAt?: string;
  mode?: "development" | "production";
}

// ============================================================
// Config types
// ============================================================

export interface SpektaConfig {
  spec_dir: string;
  analyzer: {
    rspec?: {
      spec_types: string[];
    };
    vitest?: {
      spec_dir?: string;
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
