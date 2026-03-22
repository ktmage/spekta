import * as path from "node:path";
import type { Page, Section } from "@ktmage/spekta";
import { escapeHtml } from "../html.js";
import { stepToPhrase } from "../step-phrase.js";

export function renderSection(
  section: Section,
  depth: number,
  allPages: Page[],
  pageById: Map<string, Page>,
  imagePaths: string[],
): string {
  const depthClass = `spec-group--depth-${Math.min(depth, 4)}`;
  const headingLevel = Math.min(depth + 1, 5);
  const headingTag = `h${headingLevel}`;

  const summaryAttr = section.attributes?.find((a) => a.type === "summary");
  const whyAttr = section.attributes?.find((a) => a.type === "why");
  const seeAttrs = section.attributes?.filter((a) => a.type === "see") ?? [];
  const imageAttr = section.attributes?.find((a) => a.type === "image");
  const graphAttr = section.attributes?.find((a) => a.type === "graph");

  const parts: string[] = [];

  parts.push(`<div class="spec-group ${depthClass}" id="${escapeHtml(section.id)}">`);
  parts.push(`  <div class="spec-group__header">`);
  parts.push(`    <${headingTag} class="spec-group__heading">${escapeHtml(section.title)}</${headingTag}>`);

  if (summaryAttr?.text) {
    parts.push(`    <p class="spec-group__summary">${escapeHtml(summaryAttr.text)}</p>`);
  }

  if (seeAttrs.length > 0) {
    const links = seeAttrs
      .map((attr) => {
        const refPage = pageById.get(attr.ref ?? "");
        if (!refPage) return "";
        return `<a href="/${escapeHtml(refPage.id)}/" class="spec-group__related-link">${escapeHtml(refPage.title)}</a>`;
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

  if (whyAttr?.text) {
    parts.push(`  <div class="spec-callout--why">`);
    parts.push(`    <div class="spec-callout__label">なぜ？</div>`);
    parts.push(`    <div class="spec-callout__text">${escapeHtml(whyAttr.text)}</div>`);
    parts.push(`  </div>`);
  }

  if (imageAttr?.text) {
    imagePaths.push(imageAttr.text);
    const filename = path.basename(imageAttr.text);
    parts.push(`  <div class="spec-image">`);
    parts.push(`    <img src="/images/${escapeHtml(filename)}" alt="${escapeHtml(section.title)}" />`);
    parts.push(`  </div>`);
  }

  if (graphAttr?.text) {
    parts.push(`  <div class="spec-graph">`);
    parts.push(`    <div class="mermaid">${escapeHtml(graphAttr.text)}</div>`);
    parts.push(`  </div>`);
  }

  if (section.steps && section.steps.length > 0) {
    parts.push(`  <ol class="spec-example__steps">`);
    for (const step of section.steps) {
      parts.push(`    <li>${escapeHtml(stepToPhrase(step))}</li>`);
    }
    parts.push(`  </ol>`);
  }

  if (section.sections && section.sections.length > 0) {
    parts.push(`  <div class="spec-group__children">`);
    for (const childSection of section.sections) {
      parts.push(renderSection(childSection, depth + 1, allPages, pageById, imagePaths));
    }
    parts.push(`  </div>`);
  }

  parts.push(`</div>`);
  return parts.join("\n");
}
