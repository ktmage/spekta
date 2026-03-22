import type { Page, Section, Attribute } from "./types.js";

/**
 * Build a mapping from page title to page ID for all pages.
 */
export function buildTitleToIdMap(pages: Page[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const page of pages) {
    map.set(page.title, page.id);
  }
  return map;
}

/**
 * Resolve see references in the pages array.
 *
 * See attributes in the raw analyzer output have their text field set to
 * a file path reference like:
 *   - "spec/features/review_spec.rb"            (references all pages in file)
 *   - "spec/features/company_spec.rb:企業詳細ページ" (references a specific page by title)
 *
 * After resolution, the text field is removed and replaced with a ref field
 * containing the target page's ID.
 */
export function resolveRefs(
  pages: Page[],
  fileToPages: Map<string, Page[]>,
  titleToId: Map<string, string>,
): void {
  for (const page of pages) {
    resolveAttributeRefs(page.attributes, fileToPages, titleToId);
    if (page.sections) {
      resolveSectionRefs(page.sections, fileToPages, titleToId);
    }
  }
}

function resolveSectionRefs(
  sections: Section[],
  fileToPages: Map<string, Page[]>,
  titleToId: Map<string, string>,
): void {
  for (const section of sections) {
    resolveAttributeRefs(section.attributes, fileToPages, titleToId);
    if (section.sections) {
      resolveSectionRefs(section.sections, fileToPages, titleToId);
    }
  }
}

function resolveAttributeRefs(
  attributes: Attribute[] | undefined,
  fileToPages: Map<string, Page[]>,
  titleToId: Map<string, string>,
): void {
  if (!attributes) return;

  for (const attr of attributes) {
    if (attr.type !== "see" || !attr.text) continue;

    const refText = attr.text;

    // Parse "file.rb:SectionTitle" or just "file.rb"
    const colonIndex = refText.lastIndexOf(":");
    let filePath: string;
    let targetTitle: string | undefined;

    // Check if the colon is part of a Windows drive letter or not present
    if (colonIndex > 0 && !refText.substring(0, colonIndex).endsWith("\\")) {
      filePath = refText.substring(0, colonIndex);
      targetTitle = refText.substring(colonIndex + 1);
    } else {
      filePath = refText;
      targetTitle = undefined;
    }

    if (targetTitle) {
      // Resolve by title
      const id = titleToId.get(targetTitle);
      if (id) {
        attr.ref = id;
        delete attr.text;
      } else {
        console.error(`[resolve-refs] Could not find page with title "${targetTitle}" referenced in see attribute: ${refText}`);
      }
    } else {
      // Resolve by file: reference the first page in that file
      const pagesInFile = fileToPages.get(filePath);
      if (pagesInFile && pagesInFile.length > 0) {
        attr.ref = pagesInFile[0].id;
        delete attr.text;
      } else {
        // Try to find by searching all file keys that end with the given path
        let found = false;
        for (const [key, filePages] of fileToPages) {
          if (key.endsWith(filePath) && filePages.length > 0) {
            attr.ref = filePages[0].id;
            delete attr.text;
            found = true;
            break;
          }
        }
        if (!found) {
          console.error(`[resolve-refs] Could not find pages for file "${filePath}" referenced in see attribute: ${refText}`);
        }
      }
    }
  }
}
