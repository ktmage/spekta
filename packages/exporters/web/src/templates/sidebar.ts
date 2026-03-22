import type { Page } from "@ktmage/spekta";
import { escapeHtml } from "../html.js";
import type { SearchEntry } from "../search.js";

const CHEVRON_SVG = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

export function renderSidebar(
  pages: Page[],
  currentPageId: string,
  searchEntries: SearchEntry[],
): string {
  const navItems = pages.map((page) => {
    const isActive = page.id === currentPageId;
    const activeClass = isActive ? " sidebar__link--active" : "";
    const openAttr = isActive ? " open" : "";

    let subtreeHtml = "";
    if (page.sections && page.sections.length > 0) {
      const sectionItems = page.sections.map((section) => {
        let childrenHtml = "";
        if (section.sections && section.sections.length > 0) {
          const childItems = section.sections.map((child) => {
            const isLeaf = !child.sections || child.sections.length === 0;
            const leafClass = isLeaf ? " sidebar__sublink--leaf" : "";
            return `<li><a href="/${escapeHtml(page.id)}/#${escapeHtml(child.id)}" class="sidebar__sublink${leafClass}">${escapeHtml(child.title)}</a></li>`;
          }).join("");
          childrenHtml = `<ul class="sidebar__subtree">${childItems}</ul>`;
        }
        return `<li><a href="/${escapeHtml(page.id)}/#${escapeHtml(section.id)}" class="sidebar__sublink">${escapeHtml(section.title)}</a>${childrenHtml}</li>`;
      }).join("");
      subtreeHtml = `<ul class="sidebar__subtree">${sectionItems}</ul>`;
    }

    return `<div class="sidebar__section">
          <details${openAttr}>
            <summary>
              <a href="/${escapeHtml(page.id)}/" class="sidebar__link sidebar__link--top${activeClass}">
                <span class="sidebar__link-label">${escapeHtml(page.title)}</span>
                <span class="sidebar__toggle">${CHEVRON_SVG}</span>
              </a>
            </summary>
            ${subtreeHtml}
          </details>
        </div>`;
  }).join("\n        ");

  return `<aside class="sidebar" id="sidebar">
      <div class="sidebar__header">
        <div class="sidebar__label">目次</div>
      </div>
      <div class="sidebar__search">
        <div class="search">
          <input type="text" class="search__input" id="spekta-search" placeholder="検索..." />
          <div class="search__results" id="spekta-search-results"></div>
        </div>
      </div>
      <nav class="sidebar__nav">
        ${navItems}
      </nav>
    </aside>`;
}
