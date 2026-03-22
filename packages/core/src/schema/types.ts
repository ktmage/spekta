// Re-export all types from schema.ts
export type {
  Step,
  Attribute,
  Section,
  Page,
  IR as BehaviorIR,
} from "./schema.js";

// Config types (not part of IR schema)

export interface SpektaConfig {
  target_dir: string;
  include?: string[];
  exclude?: string[];
  annotator?: Record<string, Record<string, unknown> | null>;
  exporter?: Record<string, Record<string, unknown> | null>;
}
