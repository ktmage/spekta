import { z } from "zod/v4";

const sha256Id = z.string().regex(/^[0-9a-f]{64}$/, "ID must be a SHA256 hex string");

// --- Node: IR のすべての要素は Node ---
// 全 Node が id を持つ。type ごとに追加フィールドが異なる。

const summaryNodeSchema = z.object({
  type: z.literal("summary"),
  id: sha256Id,
  text: z.string(),
});

const whyNodeSchema = z.object({
  type: z.literal("why"),
  id: sha256Id,
  text: z.string(),
});

const seeNodeSchema = z.object({
  type: z.literal("see"),
  id: sha256Id,
  ref: sha256Id,
});

const stepNodeSchema = z.object({
  type: z.literal("step"),
  id: sha256Id,
  text: z.string(),
});

const imageNodeSchema = z.object({
  type: z.literal("image"),
  id: sha256Id,
  path: z.string(),
});

const graphNodeSchema = z.object({
  type: z.literal("graph"),
  id: sha256Id,
  text: z.string(),
});

const textNodeSchema = z.object({
  type: z.literal("text"),
  id: sha256Id,
  text: z.string(),
});

const codeNodeSchema = z.object({
  type: z.literal("code"),
  id: sha256Id,
  language: z.string(),
  text: z.string(),
});

const calloutNodeSchema = z.object({
  type: z.literal("callout"),
  id: sha256Id,
  variant: z.enum(["note", "warning", "tip"]),
  text: z.string(),
});

const itemNodeSchema = z.object({
  type: z.literal("item"),
  id: sha256Id,
  text: z.string(),
});

// Leaf nodes (children を持たない)
type LeafNode = z.infer<typeof summaryNodeSchema>
  | z.infer<typeof whyNodeSchema>
  | z.infer<typeof seeNodeSchema>
  | z.infer<typeof stepNodeSchema>
  | z.infer<typeof imageNodeSchema>
  | z.infer<typeof graphNodeSchema>
  | z.infer<typeof textNodeSchema>
  | z.infer<typeof codeNodeSchema>
  | z.infer<typeof calloutNodeSchema>
  | z.infer<typeof itemNodeSchema>;

// Container nodes (children を持つ)

export interface SectionNodeInput {
  type: "section";
  id: string;
  title: string;
  children?: NodeInput[];
}

// steps の children に入れるノード
type StepsChildNode = z.infer<typeof stepNodeSchema>
  | z.infer<typeof imageNodeSchema>
  | z.infer<typeof graphNodeSchema>;

export interface StepsNodeInput {
  type: "steps";
  id: string;
  children?: StepsChildNode[];
}

// list の children に入れるノード
type ListChildNode = z.infer<typeof itemNodeSchema>;

export interface ListNodeInput {
  type: "list";
  id: string;
  children?: ListChildNode[];
}

export type NodeInput = LeafNode | SectionNodeInput | StepsNodeInput | ListNodeInput;

const sectionNodeSchema: z.ZodType<SectionNodeInput> = z.object({
  type: z.literal("section"),
  id: sha256Id,
  title: z.string(),
  children: z.lazy(() => z.array(nodeSchema)).optional(),
});

const stepsChildSchema = z.union([stepNodeSchema, imageNodeSchema, graphNodeSchema]);

const stepsNodeSchema: z.ZodType<StepsNodeInput> = z.object({
  type: z.literal("steps"),
  id: sha256Id,
  children: z.array(stepsChildSchema).optional(),
});

const listNodeSchema: z.ZodType<ListNodeInput> = z.object({
  type: z.literal("list"),
  id: sha256Id,
  children: z.array(itemNodeSchema).optional(),
});

export const nodeSchema: z.ZodType<NodeInput> = z.union([
  summaryNodeSchema,
  whyNodeSchema,
  seeNodeSchema,
  stepNodeSchema,
  imageNodeSchema,
  graphNodeSchema,
  textNodeSchema,
  codeNodeSchema,
  calloutNodeSchema,
  itemNodeSchema,
  sectionNodeSchema,
  stepsNodeSchema,
  listNodeSchema,
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
export type StepsNode = StepsNodeInput;
export type ListNode = ListNodeInput;
export type Page = z.infer<typeof pageSchema>;
export type IR = z.infer<typeof irSchema>;

export type SummaryNode = z.infer<typeof summaryNodeSchema>;
export type WhyNode = z.infer<typeof whyNodeSchema>;
export type SeeNode = z.infer<typeof seeNodeSchema>;
export type StepNode = z.infer<typeof stepNodeSchema>;
export type ImageNode = z.infer<typeof imageNodeSchema>;
export type GraphNode = z.infer<typeof graphNodeSchema>;
export type TextNode = z.infer<typeof textNodeSchema>;
export type CodeNode = z.infer<typeof codeNodeSchema>;
export type CalloutNode = z.infer<typeof calloutNodeSchema>;
export type ItemNode = z.infer<typeof itemNodeSchema>;

// --- Validation ---
export function validate(data: unknown): IR {
  return irSchema.parse(data);
}
