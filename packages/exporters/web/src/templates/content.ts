import * as path from "node:path";
import type { Page } from "@ktmage/spekta";
import { escapeHtml } from "../html.js";
import { renderSection } from "./section.js";

export function renderPageContent(
  page: Page,
  allPages: Page[],
  pageById: Map<string, Page>,
  imagePaths: string[],
): string {
  const parts: string[] = [];

  parts.push(`<div class="spec-content">`);
  parts.push(`  <h1 class="spec-content__title">${escapeHtml(page.title)}</h1>`);

  const summaryAttr = page.attributes?.find((a) => a.type === "summary");
  const seeRefs = page.attributes?.filter((a) => a.type === "see") ?? [];
  const imageAttr = page.attributes?.find((a) => a.type === "image");
  const graphAttr = page.attributes?.find((a) => a.type === "graph");

  if (summaryAttr?.text) {
    parts.push(`  <p class="spec-content__summary">${escapeHtml(summaryAttr.text)}</p>`);
  }

  if (seeRefs.length > 0) {
    const links = seeRefs
      .map((attr) => {
        const refPage = pageById.get(attr.ref ?? "");
        if (!refPage) return "";
        return `<a href="/${escapeHtml(refPage.id)}/" class="spec-content__related-link">${escapeHtml(refPage.title)}</a>`;
      })
      .filter((link) => link !== "")
      .join(" ");
    if (links) {
      parts.push(`  <div class="spec-content__related">`);
      parts.push(`    <span class="spec-content__related-label">関連:</span>`);
      parts.push(`    ${links}`);
      parts.push(`  </div>`);
    }
  }

  if (imageAttr?.text) {
    imagePaths.push(imageAttr.text);
    const filename = path.basename(imageAttr.text);
    parts.push(`  <div class="spec-image">`);
    parts.push(`    <img src="/images/${escapeHtml(filename)}" alt="${escapeHtml(page.title)}" />`);
    parts.push(`  </div>`);
  }

  if (graphAttr?.text) {
    parts.push(`  <div class="spec-graph">`);
    parts.push(`    <div class="mermaid">${escapeHtml(graphAttr.text)}</div>`);
    parts.push(`  </div>`);
  }

  if (page.sections && page.sections.length > 0) {
    parts.push(`  <div class="spec-content__body">`);
    for (const section of page.sections) {
      parts.push(renderSection(section, 1, allPages, pageById, imagePaths));
    }
    parts.push(`  </div>`);
  }

  parts.push(`</div>`);
  return parts.join("\n      ");
}
