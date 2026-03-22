import type { Node, SectionNode, Page } from "@ktmage/spekta";

export function findNode<T extends Node["type"]>(
  children: Node[] | undefined,
  type: T,
): Extract<Node, { type: T }> | undefined {
  return children?.find((node): node is Extract<Node, { type: T }> => node.type === type);
}

export function filterNodes<T extends Node["type"]>(
  children: Node[] | undefined,
  type: T,
): Array<Extract<Node, { type: T }>> {
  return (children?.filter((node): node is Extract<Node, { type: T }> => node.type === type)) ?? [];
}

export function getSections(children: Node[] | undefined): SectionNode[] {
  return filterNodes(children, "section");
}

export function getDisplayTitle(page: Page): string {
  const firstSection = findNode(page.children, "section");
  return firstSection?.title ?? page.title;
}
