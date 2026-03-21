// TypeScript types matching the Spekta Behavior IR schema

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
  type: string;
  text?: string;
  ref?: string;
}

/**
 * A single action or assertion within a section.
 */
export interface Step {
  action: string;
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

/**
 * Load IR data from the JSON file at build time.
 */
export async function loadIR(): Promise<BehaviorIR> {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const filePath = path.resolve("public/data/behavior.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as BehaviorIR;
}

/**
 * Load site info from site.json at build time.
 */
export async function loadSiteInfo(): Promise<SiteInfo> {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const filePath = path.resolve("public/data/site.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as SiteInfo;
  } catch {
    return {};
  }
}

/**
 * Helper to find a page by ID.
 */
export function findPageById(
  pages: Page[],
  id: string,
): Page | undefined {
  return pages.find((p) => p.id === id);
}

/**
 * Convert a step to a natural Japanese phrase.
 */
export function stepToPhrase(step: Step): string {
  switch (step.action) {
    case "visit":
      return "ページを開く";
    case "click_on":
      return `「${step.target}」をクリック`;
    case "fill_in":
      return step.value !== undefined && step.value !== ""
        ? `「${step.target}」に「${step.value}」と入力`
        : `「${step.target}」を空にする`;
    case "select":
      return `「${step.target}」から「${step.value}」を選択`;
    case "expect":
      if (step.target.startsWith("not: ")) {
        return `「${step.target.slice(5)}」が表示されない`;
      }
      return `「${step.target}」が表示される`;
    default:
      return step.target;
  }
}

/**
 * Collect all sections (flattened) from a page for search indexing.
 */
export interface SearchEntry {
  pageId: string;
  pageTitle: string;
  sectionId?: string;
  sectionTitle?: string;
}

export function collectSearchEntries(pages: Page[]): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const page of pages) {
    entries.push({ pageId: page.id, pageTitle: page.title });
    if (page.sections) {
      collectSectionsForSearch(entries, page.id, page.title, page.sections);
    }
  }
  return entries;
}

function collectSectionsForSearch(
  entries: SearchEntry[],
  pageId: string,
  pageTitle: string,
  sections: Section[],
): void {
  for (const section of sections) {
    entries.push({
      pageId,
      pageTitle,
      sectionId: section.id,
      sectionTitle: section.title,
    });
    if (section.sections) {
      collectSectionsForSearch(entries, pageId, pageTitle, section.sections);
    }
  }
}
