import { z } from "zod/v4";

const sha256Id = z.string().regex(/^[0-9a-f]{64}$/, "ID must be a SHA256 hex string");

// --- Node: IR のすべての要素は Node ---
// type ごとに持つフィールドが異なる。children で再帰的にネストできる。

const summaryNodeSchema = z.object({
  type: z.literal("summary"),
  text: z.string(),
});

const whyNodeSchema = z.object({
  type: z.literal("why"),
  text: z.string(),
});

const seeNodeSchema = z.object({
  type: z.literal("see"),
  ref: sha256Id,
});

const stepNodeSchema = z.object({
  type: z.literal("step"),
  text: z.string(),
});

const imageNodeSchema = z.object({
  type: z.literal("image"),
  path: z.string(),
});

const graphNodeSchema = z.object({
  type: z.literal("graph"),
  text: z.string(),
});

// Section は children を持てる Node
export interface SectionNodeInput {
  type: "section";
  id: string;
  title: string;
  children?: NodeInput[];
}

// Node の union（section は再帰のため lazy で定義）
type LeafNode = z.infer<typeof summaryNodeSchema>
  | z.infer<typeof whyNodeSchema>
  | z.infer<typeof seeNodeSchema>
  | z.infer<typeof stepNodeSchema>
  | z.infer<typeof imageNodeSchema>
  | z.infer<typeof graphNodeSchema>;

export type NodeInput = LeafNode | SectionNodeInput;

const sectionNodeSchema: z.ZodType<SectionNodeInput> = z.object({
  type: z.literal("section"),
  id: sha256Id,
  title: z.string(),
  children: z.lazy(() => z.array(nodeSchema)).optional(),
});

export const nodeSchema: z.ZodType<NodeInput> = z.union([
  summaryNodeSchema,
  whyNodeSchema,
  seeNodeSchema,
  stepNodeSchema,
  imageNodeSchema,
  graphNodeSchema,
  sectionNodeSchema,
]);

// --- Page ---
export const pageSchema = z.object({
  id: sha256Id,
  type: z.enum(["feature"]),
  title: z.string(),
  children: z.array(nodeSchema).optional(),
});

// --- IR (root) ---
export const irSchema = z.object({
  version: z.string(),
  pages: z.array(pageSchema),
});

// --- Inferred Types ---
export type Node = NodeInput;
export type SectionNode = SectionNodeInput;
export type Page = z.infer<typeof pageSchema>;
export type IR = z.infer<typeof irSchema>;

// Convenience type aliases for specific node types
export type SummaryNode = z.infer<typeof summaryNodeSchema>;
export type WhyNode = z.infer<typeof whyNodeSchema>;
export type SeeNode = z.infer<typeof seeNodeSchema>;
export type StepNode = z.infer<typeof stepNodeSchema>;
export type ImageNode = z.infer<typeof imageNodeSchema>;
export type GraphNode = z.infer<typeof graphNodeSchema>;

// --- Validation ---
export function validate(data: unknown): IR {
  return irSchema.parse(data);
}
