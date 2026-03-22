import type { Page, Section } from "@ktmage/spekta";

/**
 * Generate page URL path: /{type}/{title}/
 */
export function pageUrlPath(page: Page): string {
  return `/${page.type}/${page.title}/`;
}

/**
 * Generate GitHub-style anchor IDs for all sections in a page.
 * Duplicate titles get -1, -2, etc. appended.
 */
export function buildAnchorMap(page: Page): Map<string, string> {
  const anchorMap = new Map<string, string>();
  const usedAnchors = new Map<string, number>();

  if (page.sections) {
    collectAnchors(page.sections, anchorMap, usedAnchors);
  }

  return anchorMap;
}

function collectAnchors(
  sections: Section[],
  anchorMap: Map<string, string>,
  usedAnchors: Map<string, number>,
): void {
  for (const section of sections) {
    const baseAnchor = section.title;
    const count = usedAnchors.get(baseAnchor) ?? 0;
    const anchor = count === 0 ? baseAnchor : `${baseAnchor}-${count}`;
    usedAnchors.set(baseAnchor, count + 1);
    anchorMap.set(section.id, anchor);

    if (section.sections) {
      collectAnchors(section.sections, anchorMap, usedAnchors);
    }
  }
}
