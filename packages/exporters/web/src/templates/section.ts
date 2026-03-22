import * as path from "node:path";
import type { Page, SectionNode } from "@ktmage/spekta";
import { escapeHtml } from "../html.js";
import { pageUrlPath } from "../anchor.js";
import { findNode, filterNodes, getSections } from "../ir-helpers.js";

export function renderSection(
  sectionNode: SectionNode,
  depth: number,
  allPages: Page[],
  pageById: Map<string, Page>,
  imagePaths: string[],
  anchorMap: Map<string, string>,
): string {
  const depthClass = `spec-group--depth-${Math.min(depth, 4)}`;
  const headingLevel = Math.min(depth + 1, 5);
  const headingTag = `h${headingLevel}`;
  const sectionAnchor = anchorMap.get(sectionNode.id) ?? sectionNode.title;

  const summaryNode = findNode(sectionNode.children, "summary");
  const whyNode = findNode(sectionNode.children, "why");
  const seeNodes = filterNodes(sectionNode.children, "see");
  const imageNode = findNode(sectionNode.children, "image");
  const graphNode = findNode(sectionNode.children, "graph");
  const stepsNode = findNode(sectionNode.children, "steps");
  const childSections = getSections(sectionNode.children);

  const parts: string[] = [];

  parts.push(`<div class="spec-group ${depthClass}" id="${escapeHtml(sectionAnchor)}">`);
  parts.push(`  <div class="spec-group__header">`);
  parts.push(`    <${headingTag} class="spec-group__heading">${escapeHtml(sectionNode.title)}</${headingTag}>`);

  if (summaryNode) {
    parts.push(`    <p class="spec-group__summary">${escapeHtml(summaryNode.text)}</p>`);
  }

  if (seeNodes.length > 0) {
    const links = seeNodes
      .map((seeNode) => {
        const refPage = pageById.get(seeNode.ref);
        if (!refPage) return "";
        return `<a href="${escapeHtml(pageUrlPath(refPage))}" class="spec-group__related-link">${escapeHtml(refPage.title)}</a>`;
      })
      .filter((link) => link !== "")
      .join(" ");
    if (links) {
      parts.push(`    <div class="spec-group__related">`);
      parts.push(`      <span class="spec-group__related-label">関連:</span>`);
      parts.push(`      ${links}`);
      parts.push(`    </div>`);
    }
  }

  parts.push(`  </div>`);

  if (whyNode) {
    parts.push(`  <div class="spec-callout--why">`);
    parts.push(`    <div class="spec-callout__label">なぜ？</div>`);
    parts.push(`    <div class="spec-callout__text">${escapeHtml(whyNode.text)}</div>`);
    parts.push(`  </div>`);
  }

  if (imageNode) {
    imagePaths.push(imageNode.path);
    const filename = path.basename(imageNode.path);
    parts.push(`  <div class="spec-image">`);
    parts.push(`    <img src="/images/${escapeHtml(filename)}" alt="${escapeHtml(sectionNode.title)}" />`);
    parts.push(`  </div>`);
  }

  if (graphNode) {
    parts.push(`  <div class="spec-graph">`);
    parts.push(`    <div class="mermaid">${escapeHtml(graphNode.text)}</div>`);
    parts.push(`  </div>`);
  }

  if (stepsNode && stepsNode.children) {
    parts.push(`  <ol class="spec-example__steps">`);
    for (const stepsChild of stepsNode.children) {
      if (stepsChild.type === "step") {
        parts.push(`    <li>${escapeHtml(stepsChild.text)}</li>`);
      } else if (stepsChild.type === "image") {
        const filename = path.basename(stepsChild.path);
        imagePaths.push(stepsChild.path);
        parts.push(`    <li><img src="/images/${escapeHtml(filename)}" alt="${escapeHtml(filename)}" /></li>`);
      } else if (stepsChild.type === "graph") {
        parts.push(`    <li><div class="mermaid">${escapeHtml(stepsChild.text)}</div></li>`);
      }
    }
    parts.push(`  </ol>`);
  }

  if (childSections.length > 0) {
    parts.push(`  <div class="spec-group__children">`);
    for (const childSection of childSections) {
      parts.push(renderSection(childSection, depth + 1, allPages, pageById, imagePaths, anchorMap));
    }
    parts.push(`  </div>`);
  }

  parts.push(`</div>`);
  return parts.join("\n");
}
