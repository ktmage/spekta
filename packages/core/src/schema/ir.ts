import { z } from "zod/v4";

// --- Step ---
export const stepSchema = z.object({
  text: z.string(),
});

// --- Attribute ---
export const attributeSchema = z.object({
  type: z.enum(["summary", "why", "see", "step", "image", "graph"]),
  text: z.string().optional(),
  ref: z.string().optional(),
});

// --- Section (recursive) ---
export interface SectionInput {
  id: string;
  title: string;
  attributes?: z.input<typeof attributeSchema>[];
  sections?: SectionInput[];
  steps?: z.input<typeof stepSchema>[];
}

export const sectionSchema: z.ZodType<SectionInput> = z.object({
  id: z.string(),
  title: z.string(),
  attributes: z.array(attributeSchema).optional(),
  sections: z.lazy(() => z.array(sectionSchema)).optional(),
  steps: z.array(stepSchema).optional(),
});

// --- Page ---
export const pageSchema = z.object({
  id: z.string(),
  type: z.enum(["feature"]),
  title: z.string(),
  attributes: z.array(attributeSchema).optional(),
  sections: z.array(sectionSchema).optional(),
});

// --- IR (root) ---
export const irSchema = z.object({
  version: z.string(),
  pages: z.array(pageSchema),
});

// --- Inferred Types ---
export type Step = z.infer<typeof stepSchema>;
export type Attribute = z.infer<typeof attributeSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type Page = z.infer<typeof pageSchema>;
export type IR = z.infer<typeof irSchema>;

// --- Validation ---
export function validate(data: unknown): IR {
  return irSchema.parse(data);
}
