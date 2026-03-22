import type { Page, Node, SectionNode } from "@ktmage/spekta";

export interface SearchEntry {
  pageId: string;
  pageTitle: string;
  sectionTitle?: string;
  sectionId?: string;
}

export function collectSearchEntries(pages: Page[]): SearchEntry[] {
  const searchEntries: SearchEntry[] = [];
  for (const page of pages) {
    searchEntries.push({ pageId: page.id, pageTitle: page.title });
    if (page.children) {
      collectSectionsForSearch(page.id, page.title, page.children, searchEntries);
    }
  }
  return searchEntries;
}

function collectSectionsForSearch(
  pageId: string,
  pageTitle: string,
  children: Node[],
  searchEntries: SearchEntry[],
): void {
  for (const node of children) {
    if (node.type !== "section") continue;
    searchEntries.push({
      pageId,
      pageTitle,
      sectionTitle: node.title,
      sectionId: node.id,
    });
    if (node.children) {
      collectSectionsForSearch(pageId, pageTitle, node.children, searchEntries);
    }
  }
}
