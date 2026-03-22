import type { Page, Node, SectionNode } from "@ktmage/spekta";
import { getSections } from "./ir-helpers.js";

export function pageUrlPath(page: Page): string {
  return `/${page.type}/${page.title}/`;
}

export function buildAnchorMap(page: Page): Map<string, string> {
  const anchorMap = new Map<string, string>();
  const usedAnchors = new Map<string, number>();

  collectAnchors(page.children, anchorMap, usedAnchors);

  return anchorMap;
}

function collectAnchors(
  children: Node[] | undefined,
  anchorMap: Map<string, string>,
  usedAnchors: Map<string, number>,
): void {
  if (!children) return;
  for (const node of children) {
    if (node.type !== "section") continue;
    const baseAnchor = node.title;
    const count = usedAnchors.get(baseAnchor) ?? 0;
    const anchor = count === 0 ? baseAnchor : `${baseAnchor}-${count}`;
    usedAnchors.set(baseAnchor, count + 1);
    anchorMap.set(node.id, anchor);

    if (node.children) {
      collectAnchors(node.children, anchorMap, usedAnchors);
    }
  }
}
