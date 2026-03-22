import type { Page, Section } from "@ktmage/spekta";

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
    if (page.sections) {
      collectSectionsForSearch(page.id, page.title, page.sections, searchEntries);
    }
  }
  return searchEntries;
}

function collectSectionsForSearch(
  pageId: string,
  pageTitle: string,
  sections: Section[],
  searchEntries: SearchEntry[],
): void {
  for (const section of sections) {
    searchEntries.push({
      pageId,
      pageTitle,
      sectionTitle: section.title,
      sectionId: section.id,
    });
    if (section.sections) {
      collectSectionsForSearch(pageId, pageTitle, section.sections, searchEntries);
    }
  }
}
