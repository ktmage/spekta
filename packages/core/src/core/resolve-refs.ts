import type { Page, Section, Attribute } from "../schema/types.js";

export function buildPageTitleToIdMap(pages: Page[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const page of pages) {
    map.set(page.title, page.id);
  }
  return map;
}

/**
 * Resolve see references in the pages array.
 *
 * Parser sets attr.ref to the raw text from [spekta:see] comments, which can be:
 *   - "spec/features/review_spec.rb"            (file path → first page in file)
 *   - "spec/features/company_spec.rb:企業詳細ページ" (file path:title → page by title)
 *   - "企業詳細ページ"                            (title only → page by title)
 *
 * After resolution, attr.ref is replaced with the target page's ID.
 */
export function resolveRefs(
  pages: Page[],
  fileToPages: Map<string, Page[]>,
  pageTitleToIdMap: Map<string, string>,
): void {
  for (const page of pages) {
    resolveAttributeRefs(page.attributes, fileToPages, pageTitleToIdMap);
    if (page.sections) {
      resolveSectionRefs(page.sections, fileToPages, pageTitleToIdMap);
    }
  }
}

function resolveSectionRefs(
  sections: Section[],
  fileToPages: Map<string, Page[]>,
  pageTitleToIdMap: Map<string, string>,
): void {
  for (const section of sections) {
    resolveAttributeRefs(section.attributes, fileToPages, pageTitleToIdMap);
    if (section.sections) {
      resolveSectionRefs(section.sections, fileToPages, pageTitleToIdMap);
    }
  }
}

function resolveAttributeRefs(
  attributes: Attribute[] | undefined,
  fileToPages: Map<string, Page[]>,
  pageTitleToIdMap: Map<string, string>,
): void {
  if (!attributes) return;

  for (const attr of attributes) {
    if (attr.type !== "see" || !attr.ref) continue;

    const refText = attr.ref;

    // Try title-only match first (e.g. "企業詳細ページ")
    const titleOnlyId = pageTitleToIdMap.get(refText);
    if (titleOnlyId) {
      attr.ref = titleOnlyId;
      continue;
    }

    // Parse "file:Title" or just "file"
    const colonIndex = refText.lastIndexOf(":");
    let filePath: string;
    let targetTitle: string | undefined;

    if (colonIndex > 0 && !refText.substring(0, colonIndex).endsWith("\\")) {
      filePath = refText.substring(0, colonIndex);
      targetTitle = refText.substring(colonIndex + 1);
    } else {
      filePath = refText;
      targetTitle = undefined;
    }

    if (targetTitle) {
      const pageId = pageTitleToIdMap.get(targetTitle);
      if (pageId) {
        attr.ref = pageId;
      } else {
        console.error(`[resolve-refs] Page "${targetTitle}" not found (from: ${refText})`);
      }
    } else {
      const pagesInFile = fileToPages.get(filePath);
      if (pagesInFile && pagesInFile.length > 0) {
        attr.ref = pagesInFile[0].id;
      } else {
        let found = false;
        for (const [key, filePages] of fileToPages) {
          if (key.endsWith(filePath) && filePages.length > 0) {
            attr.ref = filePages[0].id;
            found = true;
            break;
          }
        }
        if (!found) {
          console.error(`[resolve-refs] File "${filePath}" not found (from: ${refText})`);
        }
      }
    }
  }
}
