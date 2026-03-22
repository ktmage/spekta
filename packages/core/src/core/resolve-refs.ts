import type { Page, Node, SectionNode, SeeNode } from "../schema/types.js";

function buildPathToIdMap(pages: Page[]): Map<string, string> {
  const pathToIdMap = new Map<string, string>();

  for (const page of pages) {
    pathToIdMap.set(page.title, page.id);
    if (page.children) {
      buildNodePaths(page.title, page.children, pathToIdMap);
    }
  }

  return pathToIdMap;
}

function buildNodePaths(
  parentPath: string,
  nodes: Node[],
  pathToIdMap: Map<string, string>,
): void {
  for (const node of nodes) {
    if (node.type !== "section") continue;
    const sectionPath = `${parentPath}/${node.title}`;
    pathToIdMap.set(sectionPath, node.id);
    if (node.children) {
      buildNodePaths(sectionPath, node.children, pathToIdMap);
    }
  }
}

export function resolveRefs(pages: Page[]): void {
  const pathToIdMap = buildPathToIdMap(pages);

  for (const page of pages) {
    if (page.children) {
      resolveNodesRefs(page.children, pathToIdMap);
    }
  }
}

function resolveNodesRefs(nodes: Node[], pathToIdMap: Map<string, string>): void {
  for (const node of nodes) {
    if (node.type === "see") {
      const targetId = pathToIdMap.get(node.ref);
      if (targetId) {
        (node as SeeNode).ref = targetId;
      } else {
        console.error(`[resolve-refs] "${node.ref}" not found.`);
      }
    }
    if (node.type === "section" && node.children) {
      resolveNodesRefs(node.children, pathToIdMap);
    }
  }
}
