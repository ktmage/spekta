import * as crypto from "node:crypto";
import type { Page, Section, Attribute } from "../schema/types.js";

function generateId(pathString: string): string {
  return crypto.createHash("sha256").update(pathString).digest("hex");
}

/**
 * Build a lookup of all title paths → IDs for pages and sections.
 *
 * Examples:
 *   "company-search"                              → page ID
 *   "company-search/企業検索"                      → section ID
 *   "company-search/企業検索/データが存在する場合"   → nested section ID
 */
function buildPathToIdMap(pages: Page[]): Map<string, string> {
  const pathToIdMap = new Map<string, string>();

  for (const page of pages) {
    pathToIdMap.set(page.title, page.id);
    if (page.sections) {
      buildSectionPaths(page.title, page.sections, pathToIdMap);
    }
  }

  return pathToIdMap;
}

function buildSectionPaths(
  parentPath: string,
  sections: Section[],
  pathToIdMap: Map<string, string>,
): void {
  for (const section of sections) {
    const sectionPath = `${parentPath}/${section.title}`;
    pathToIdMap.set(sectionPath, section.id);
    if (section.sections) {
      buildSectionPaths(sectionPath, section.sections, pathToIdMap);
    }
  }
}

/**
 * Resolve [spekta:see] references by title path.
 *
 * Supported formats:
 *   - "company-search"                              → page
 *   - "company-search/企業検索/データが存在する場合"   → section
 */
export function resolveRefs(pages: Page[]): void {
  const pathToIdMap = buildPathToIdMap(pages);

  for (const page of pages) {
    resolveAttributeRefs(page.attributes, pathToIdMap);
    if (page.sections) {
      resolveSectionRefs(page.sections, pathToIdMap);
    }
  }
}

function resolveSectionRefs(
  sections: Section[],
  pathToIdMap: Map<string, string>,
): void {
  for (const section of sections) {
    resolveAttributeRefs(section.attributes, pathToIdMap);
    if (section.sections) {
      resolveSectionRefs(section.sections, pathToIdMap);
    }
  }
}

function resolveAttributeRefs(
  attributes: Attribute[] | undefined,
  pathToIdMap: Map<string, string>,
): void {
  if (!attributes) return;

  for (const attr of attributes) {
    if (attr.type !== "see" || !attr.ref) continue;

    const targetId = pathToIdMap.get(attr.ref);
    if (targetId) {
      attr.ref = targetId;
    } else {
      console.error(`[resolve-refs] "${attr.ref}" not found.`);
    }
  }
}
