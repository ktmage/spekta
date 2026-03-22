import * as fs from "node:fs";
import * as path from "node:path";

// IR types (self-contained)
interface BehaviorIR {
  version: string;
  pages: Page[];
}
interface Page {
  id: string;
  type: string;
  title: string;
  attributes?: Attribute[];
  sections?: Section[];
}
interface Section {
  id: string;
  title: string;
  attributes?: Attribute[];
  sections?: Section[];
  steps?: Step[];
}
interface Attribute {
  type: string;
  text?: string;
  ref?: string;
}
interface Step {
  action: string;
  target: string;
  value?: string;
}
interface SiteInfo {
  name?: string;
  description?: string;
  builtAt?: string;
  mode?: "development" | "production";
}

export type { BehaviorIR, SiteInfo };

// ---------------------------------------------------------------------------
// stepToPhrase
// ---------------------------------------------------------------------------

function stepToPhrase(step: Step): string {
  switch (step.action) {
    case "visit":
      return "\u30DA\u30FC\u30B8\u3092\u958B\u304F";
    case "click_on":
      return `\u300C${step.target}\u300D\u3092\u30AF\u30EA\u30C3\u30AF`;
    case "fill_in":
      return step.value !== undefined && step.value !== ""
        ? `\u300C${step.target}\u300D\u306B\u300C${step.value}\u300D\u3068\u5165\u529B`
        : `\u300C${step.target}\u300D\u3092\u7A7A\u306B\u3059\u308B`;
    case "select":
      return `\u300C${step.target}\u300D\u304B\u3089\u300C${step.value}\u300D\u3092\u9078\u629E`;
    case "expect":
      if (step.target.startsWith("not: ")) {
        return `\u300C${step.target.slice(5)}\u300D\u304C\u8868\u793A\u3055\u308C\u306A\u3044`;
      }
      return `\u300C${step.target}\u300D\u304C\u8868\u793A\u3055\u308C\u308B`;
    default:
      return step.target;
  }
}

// ---------------------------------------------------------------------------
// Escape HTML
// ---------------------------------------------------------------------------

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Search entries (for embedded JSON)
// ---------------------------------------------------------------------------

interface SearchEntry {
  pageId: string;
  pageTitle: string;
  sectionId?: string;
  sectionTitle?: string;
}

function collectSearchEntries(pages: Page[]): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const page of pages) {
    entries.push({ pageId: page.id, pageTitle: page.title });
    if (page.sections) {
      collectSectionsForSearch(entries, page.id, page.title, page.sections);
    }
  }
  return entries;
}

function collectSectionsForSearch(
  entries: SearchEntry[],
  pageId: string,
  pageTitle: string,
  sections: Section[],
): void {
  for (const section of sections) {
    entries.push({
      pageId,
      pageTitle,
      sectionId: section.id,
      sectionTitle: section.title,
    });
    if (section.sections) {
      collectSectionsForSearch(entries, pageId, pageTitle, section.sections);
    }
  }
}

// ---------------------------------------------------------------------------
// CSS (embedded from global.css + component styles)
// ---------------------------------------------------------------------------

const EMBEDDED_CSS = `/* ============================================================
   Spekta - Product Specification Viewer
   ============================================================ */

/* --- Design Tokens --- */
:root {
  --color-ink: #1a1a1a;
  --color-ink-secondary: #555;
  --color-ink-tertiary: #999;
  --color-bg: #fff;
  --color-bg-subtle: #f8f8f8;
  --color-bg-muted: #f0f0f0;
  --color-border: #e5e5e5;
  --color-border-light: #eee;

  --color-accent: #2563eb;
  --color-accent-soft: #eff6ff;

  --color-callout-why-bg: #fffbeb;
  --color-callout-why-border: #d97706;
  --color-callout-why-text: #78350f;

  --sidebar-width: 256px;

  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans JP",
    "Hiragino Sans", "Hiragino Kaku Gothic ProN", Meiryo, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  --radius-sm: 4px;
  --radius-md: 6px;

  --transition-fast: 100ms ease;
}

/* --- Reset --- */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { font-size: 16px; -webkit-font-smoothing: antialiased; }
body { font-family: var(--font-sans); color: var(--color-ink); background: var(--color-bg); line-height: 1.65; }

a { text-decoration: none; color: inherit; }

/* --- Mobile Toggle (right-bottom floating) --- */
.menu-toggle {
  display: none; position: fixed; bottom: 20px; right: 20px; z-index: 1000;
  width: 44px; height: 44px; border: none;
  border-radius: 50%; background: var(--color-ink); color: #fff; cursor: pointer;
  align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: transform 200ms ease, opacity 200ms ease;
}
.menu-toggle--active { background: var(--color-ink-secondary); }

/* --- Sidebar --- */
.sidebar {
  position: fixed; top: 0; left: 0; bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-bg);
  border-right: 1px solid var(--color-border);
  overflow-y: auto; overflow-x: hidden;
  z-index: 100; display: flex; flex-direction: column;
}
.sidebar::-webkit-scrollbar { width: 0; }

.sidebar__header { padding: 20px 16px 12px; flex-shrink: 0; }

/* Search */
.sidebar__search { padding: 0 12px 8px; flex-shrink: 0; }
.search { position: relative; }
.search__input {
  display: block; width: 100%; padding: 6px 10px;
  font-family: var(--font-sans); font-size: 0.8125rem;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  background: var(--color-bg); color: var(--color-ink);
  outline: none; transition: border-color var(--transition-fast);
}
.search__input::placeholder { color: var(--color-ink-tertiary); }
.search__input:focus { border-color: var(--color-accent); }

.search__results {
  position: absolute; top: 100%; left: 0; right: 0;
  max-height: 320px; overflow-y: auto;
  background: var(--color-bg); border: 1px solid var(--color-border);
  border-top: none; border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  z-index: 200; box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.search__results:empty { display: none; }

.search__result {
  display: flex; flex-direction: column; width: 100%;
  padding: 8px 10px; border: none; background: none;
  font-family: var(--font-sans); text-align: left; cursor: pointer;
  transition: background var(--transition-fast);
  text-decoration: none; color: inherit;
}
.search__result:hover, .search__result--selected { background: var(--color-bg-subtle); }
.search__result + .search__result { border-top: 1px solid var(--color-border-light); }

.search__result-label { font-size: 0.8125rem; color: var(--color-ink); line-height: 1.4; }
.search__result-context { font-size: 0.6875rem; color: var(--color-ink-tertiary); line-height: 1.3; margin-top: 1px; }

.sidebar__brand { display: flex; align-items: center; gap: 8px; }
.sidebar__logo {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; background: var(--color-ink);
  border-radius: 5px; font-size: 0.75rem; color: #fff; font-weight: 700;
}
.sidebar__title { font-size: 0.875rem; font-weight: 700; color: var(--color-ink); line-height: 1; }
.sidebar__subtitle { font-size: 0.625rem; color: var(--color-ink-tertiary); line-height: 1; margin-top: 2px; }

/* Sidebar nav */
.sidebar__nav { flex: 1; padding: 4px 0 20px; }
.sidebar__section { margin-bottom: 0; }

/* details/summary reset */
.sidebar__nav details { border: none; }
.sidebar__nav details > summary { list-style: none; }
.sidebar__nav details > summary::-webkit-details-marker { display: none; }
.sidebar__nav details > summary::marker { display: none; content: ""; }

.sidebar__link {
  display: block; width: 100%; padding: 9px 16px;
  border: none; background: none;
  font-family: var(--font-sans); font-size: 0.8125rem; font-weight: 600;
  color: var(--color-ink); text-align: left; cursor: pointer;
  line-height: 1.4; transition: background var(--transition-fast);
  text-decoration: none;
}
.sidebar__link:hover { background: var(--color-bg-subtle); }
.sidebar__link--active { color: var(--color-accent); background: var(--color-accent-soft); }

/* Toggle (inside link, right-aligned) */
.sidebar__link--top { display: flex; align-items: center; }
.sidebar__link-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.sidebar__toggle {
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; flex-shrink: 0;
  margin-left: 4px;
  color: var(--color-ink-tertiary); border-radius: var(--radius-sm);
  transition: transform 150ms ease, color var(--transition-fast);
}
.sidebar__link:hover .sidebar__toggle { color: var(--color-ink-secondary); }
details[open] > summary .sidebar__toggle { transform: rotate(90deg); }

/* Sub-tree */
.sidebar__subtree { list-style: none; }

.sidebar__sublink {
  display: block; padding: 5px 16px 5px 28px;
  font-size: 0.75rem; font-weight: 500; color: var(--color-ink-secondary);
  text-decoration: none; line-height: 1.4; cursor: pointer;
  transition: color var(--transition-fast), background var(--transition-fast);
}
.sidebar__sublink:hover { color: var(--color-ink); background: var(--color-bg-subtle); }

.sidebar__sublink--leaf {
  font-weight: 400; font-size: 0.6875rem; color: var(--color-ink-tertiary);
  padding-top: 4px; padding-bottom: 4px; padding-left: 40px;
}
.sidebar__sublink--leaf:hover { color: var(--color-ink-secondary); }

.sidebar__subtree .sidebar__subtree .sidebar__sublink { padding-left: 36px; }
.sidebar__subtree .sidebar__subtree .sidebar__sublink--leaf { padding-left: 48px; }

/* --- Main Content --- */
.main-content {
  margin-left: var(--sidebar-width); flex: 1; min-height: 100vh; background: var(--color-bg);
}

/* --- Spec Content --- */
.spec-content {
  max-width: 780px; margin: 0 auto;
  padding: 32px 20px 48px;
}

/* Title */
.spec-content__title {
  font-size: 1.625rem; font-weight: 700; color: var(--color-ink);
  line-height: 1.25; letter-spacing: -0.02em; margin-bottom: 6px;
}

/* Summary */
.spec-content__summary {
  font-size: 0.875rem; color: var(--color-ink-secondary); line-height: 1.65; margin-bottom: 16px;
}

/* Related (top-level) */
.spec-content__related {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  font-size: 0.8125rem; color: var(--color-ink-tertiary);
  margin-bottom: 24px; padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border-light);
}
.spec-content__related-label { font-weight: 500; }
.spec-content__related-link { color: var(--color-accent); text-decoration: none; cursor: pointer; }
.spec-content__related-link:hover { text-decoration: underline; }

/* Body */
.spec-content__body { display: flex; flex-direction: column; gap: 24px; }

/* --- Groups --- */
.spec-group { position: relative; }

.spec-group--depth-1 { padding: 8px 0; }
.spec-group--depth-1 + .spec-group--depth-1 { padding-top: 20px; border-top: 1px solid var(--color-border-light); }

.spec-group--depth-2 { margin-top: 8px; }
.spec-group--depth-3, .spec-group--depth-4 { margin-top: 4px; }

.spec-group__header { margin-bottom: 8px; }

.spec-group__heading { font-weight: 600; color: var(--color-ink); line-height: 1.35; }
.spec-group--depth-1 > .spec-group__header .spec-group__heading { font-size: 1.125rem; letter-spacing: -0.01em; }
.spec-group--depth-2 > .spec-group__header .spec-group__heading { font-size: 1rem; }
.spec-group--depth-3 > .spec-group__header .spec-group__heading,
.spec-group--depth-4 > .spec-group__header .spec-group__heading { font-size: 0.875rem; }

.spec-group__summary { font-size: 0.8125rem; color: var(--color-ink-secondary); line-height: 1.6; margin-top: 2px; }

.spec-group__related { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--color-ink-tertiary); margin-top: 4px; }
.spec-group__related-label { font-weight: 500; }
.spec-group__related-link { color: var(--color-accent); text-decoration: none; }
.spec-group__related-link:hover { text-decoration: underline; }

.spec-group__children { display: flex; flex-direction: column; gap: 16px; }

/* --- Examples --- */
.spec-example { padding: 8px 0; }
.spec-example__heading { font-size: 0.875rem; font-weight: 600; color: var(--color-ink); line-height: 1.45; margin-bottom: 4px; }

/* Steps */
.spec-example__steps {
  font-size: 0.8125rem; color: var(--color-ink-secondary);
  line-height: 1.7; padding-left: 1.25em; margin-top: 4px;
}
.spec-example__steps li { padding: 1px 0; }

/* --- Callouts --- */
.spec-callout--why {
  background: var(--color-callout-why-bg);
  border-left: 3px solid var(--color-callout-why-border);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: 8px 12px; margin-top: 6px;
}
.spec-callout__label { font-size: 0.6875rem; font-weight: 600; color: var(--color-callout-why-text); margin-bottom: 1px; text-transform: uppercase; letter-spacing: 0.03em; }
.spec-callout__text { font-size: 0.8125rem; line-height: 1.6; color: var(--color-callout-why-text); }

/* --- See links --- */
.spec-see { font-size: 0.75rem; color: var(--color-ink-tertiary); margin-top: 6px; }
.spec-see__label { font-weight: 500; }
.spec-see__link { color: var(--color-accent); text-decoration: none; }
.spec-see__link:hover { text-decoration: underline; }

/* --- Graph --- */
.spec-graph {
  margin: 16px 0; padding: 20px;
  background: var(--color-bg-subtle); border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md); overflow-x: auto;
}
.spec-graph .mermaid { display: flex; justify-content: center; }

/* --- Image --- */
.spec-image { margin: 12px 0; }
.spec-image img { max-width: 100%; border-radius: var(--radius-md); border: 1px solid var(--color-border-light); }

/* --- Site Header --- */
.site-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--color-border-light);
}
.site-header__inner {
  max-width: 780px;
}
.site-header__name {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-ink);
  line-height: 1.3;
}
.site-header__description {
  font-size: 0.8125rem;
  color: var(--color-ink-tertiary);
  margin-top: 2px;
}

/* --- Site Footer --- */
.site-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border-light);
  margin-top: auto;
}
.site-footer__inner {
  max-width: 780px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--color-ink-tertiary);
}
.site-footer__badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.625rem;
  font-weight: 600;
  color: #b45309;
  background: #fef3c7;
  border-radius: 3px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.site-footer__text {
  font-weight: 500;
}
.site-footer__time {
  color: var(--color-ink-tertiary);
  opacity: 0.7;
}

/* --- Responsive --- */
@media (max-width: 768px) {
  .menu-toggle { display: flex; }
  .sidebar { transform: translateX(-100%); transition: transform 200ms ease; }
  .sidebar--open { transform: translateX(0); box-shadow: 4px 0 16px rgba(0,0,0,0.06); }
  .main-content { margin-left: 0; }
  .spec-content { padding: 32px 20px 80px; }
  .spec-content__title { font-size: 1.375rem; }
  .spec-group--depth-2 { padding-left: 16px; }
}

@media (max-width: 480px) {
  .spec-content { padding: 24px 16px 80px; }
  .spec-content__title { font-size: 1.25rem; }
}

/* --- Print --- */
@media print {
  .sidebar, .menu-toggle { display: none; }
  .main-content { margin-left: 0; }
  .spec-content { padding: 0; max-width: 100%; }
  .spec-callout--why, .spec-graph { break-inside: avoid; }
}`;

// ---------------------------------------------------------------------------
// Inline JavaScript (search + mobile menu)
// ---------------------------------------------------------------------------

const INLINE_JS = `(function() {
  // --- Mobile Menu ---
  var menuBtn = document.getElementById('menu-toggle');
  var sidebar = document.getElementById('sidebar');
  var mainContent = document.getElementById('main-content');
  var menuOpen = false;

  function setMenuOpen(open) {
    menuOpen = open;
    if (open) {
      sidebar.classList.add('sidebar--open');
      menuBtn.classList.add('menu-toggle--active');
      menuBtn.setAttribute('aria-label', '\u30E1\u30CB\u30E5\u30FC\u3092\u9589\u3058\u308B');
      menuBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><line x1="4" y1="4" x2="16" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="16" y1="4" x2="4" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    } else {
      sidebar.classList.remove('sidebar--open');
      menuBtn.classList.remove('menu-toggle--active');
      menuBtn.setAttribute('aria-label', '\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F');
      menuBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    }
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function() { setMenuOpen(!menuOpen); });
  }
  if (mainContent) {
    mainContent.addEventListener('click', function() { if (menuOpen) setMenuOpen(false); });
  }
  if (sidebar) {
    sidebar.addEventListener('click', function(e) {
      if (e.target.closest && e.target.closest('a')) { setMenuOpen(false); }
    });
  }

  // --- Search ---
  var searchInput = document.getElementById('spekta-search');
  var searchResults = document.getElementById('spekta-search-results');
  var entries = [];
  try { entries = JSON.parse(document.getElementById('spekta-search-data').textContent); } catch(e) {}

  var selectedIndex = 0;

  function renderResults(query) {
    if (!query) { searchResults.innerHTML = ''; return; }
    var q = query.toLowerCase();
    var filtered = entries.filter(function(e) {
      var pm = e.pageTitle.toLowerCase().indexOf(q) !== -1;
      var sm = e.sectionTitle ? e.sectionTitle.toLowerCase().indexOf(q) !== -1 : false;
      return pm || sm;
    });
    selectedIndex = 0;
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var entry = filtered[i];
      var hash = entry.sectionId ? '#' + entry.sectionId : '';
      var href = '/' + entry.pageId + '/' + hash;
      var cls = 'search__result' + (i === 0 ? ' search__result--selected' : '');
      var label = entry.sectionTitle || entry.pageTitle;
      var context = entry.sectionTitle ? '<span class="search__result-context">' + escHtml(entry.pageTitle) + '</span>' : '';
      html += '<a href="' + href + '" class="' + cls + '" data-index="' + i + '"><span class="search__result-label">' + escHtml(label) + '</span>' + context + '</a>';
    }
    searchResults.innerHTML = html;
  }

  function escHtml(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function updateSelected() {
    var items = searchResults.querySelectorAll('.search__result');
    for (var i = 0; i < items.length; i++) {
      if (i === selectedIndex) {
        items[i].classList.add('search__result--selected');
        items[i].scrollIntoView({ block: 'nearest' });
      } else {
        items[i].classList.remove('search__result--selected');
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', function() { renderResults(this.value); });
    searchInput.addEventListener('focus', function() { if (this.value) renderResults(this.value); });
    searchInput.addEventListener('blur', function() { setTimeout(function() { searchResults.innerHTML = ''; }, 150); });
    searchInput.addEventListener('keydown', function(e) {
      var items = searchResults.querySelectorAll('.search__result');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelected();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelected();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) { items[selectedIndex].click(); }
      } else if (e.key === 'Escape') {
        searchInput.value = '';
        searchResults.innerHTML = '';
        searchInput.blur();
      }
    });
  }
})();`;

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------

/**
 * Render BehaviorIR to static HTML files.
 *
 * For each page, generates an index.html inside {outputPath}/{pageId}/.
 * Also generates {outputPath}/index.html (redirect), {outputPath}/404.html,
 * and copies referenced images to {outputPath}/images/.
 */
export function renderWeb(
  ir: BehaviorIR,
  site: SiteInfo,
  outputPath: string,
): void {
  fs.mkdirSync(outputPath, { recursive: true });

  // Build page lookup
  const pageById = new Map<string, Page>();
  for (const page of ir.pages) {
    pageById.set(page.id, page);
  }

  // Collect search entries once
  const searchEntries = collectSearchEntries(ir.pages);

  // Collect image paths
  const imagePaths: string[] = [];

  // Generate page HTML files
  for (const page of ir.pages) {
    const html = renderPageHtml(page, ir.pages, pageById, site, searchEntries, imagePaths);
    const pageDir = path.join(outputPath, page.id);
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, "index.html"), html, "utf-8");
  }

  // Generate index.html (redirect to first page)
  if (ir.pages.length > 0) {
    const firstPageId = ir.pages[0].id;
    const indexHtml = renderRedirectHtml(`/${firstPageId}/`);
    fs.writeFileSync(path.join(outputPath, "index.html"), indexHtml, "utf-8");
  }

  // Generate 404.html
  const notFoundHtml = renderRedirectHtml("/");
  fs.writeFileSync(path.join(outputPath, "404.html"), notFoundHtml, "utf-8");

  // Copy images
  if (imagePaths.length > 0) {
    const imagesDir = path.join(outputPath, "images");
    fs.mkdirSync(imagesDir, { recursive: true });

    for (const imgPath of imagePaths) {
      const srcPath = path.resolve(imgPath);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(imagesDir, path.basename(imgPath));
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Redirect page
// ---------------------------------------------------------------------------

function renderRedirectHtml(url: string): string {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${esc(url)}" />
    <link rel="canonical" href="${esc(url)}" />
    <title>\u30EA\u30C0\u30A4\u30EC\u30AF\u30C8\u4E2D...</title>
  </head>
  <body>
    <p><a href="${esc(url)}">\u3053\u3061\u3089\u3092\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u304F\u3060\u3055\u3044</a></p>
  </body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Full page HTML
// ---------------------------------------------------------------------------

function renderPageHtml(
  page: Page,
  allPages: Page[],
  pageById: Map<string, Page>,
  site: SiteInfo,
  searchEntries: SearchEntry[],
  imagePaths: string[],
): string {
  const siteName = site.name || "Spekta";
  const title = `${esc(page.title)} - ${esc(siteName)}`;

  const sidebarHtml = renderSidebar(allPages, page.id, searchEntries);
  const contentHtml = renderPageContent(page, allPages, pageById, imagePaths);
  const headerHtml = renderSiteHeader(site);
  const footerHtml = renderSiteFooter(site);

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${EMBEDDED_CSS}</style>
    <script type="module" src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"></script>
    <script>
      document.addEventListener("DOMContentLoaded", function () {
        if (typeof mermaid !== "undefined") {
          mermaid.initialize({ startOnLoad: true, theme: "neutral" });
        }
      });
    </script>
  </head>
  <body>
    ${sidebarHtml}
    <main class="main-content" id="main-content">
      ${headerHtml}
      ${contentHtml}
      ${footerHtml}
    </main>
    <button class="menu-toggle" id="menu-toggle" aria-label="\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <script id="spekta-search-data" type="application/json">${JSON.stringify(searchEntries)}</script>
    <script>${INLINE_JS}</script>
  </body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Site Header
// ---------------------------------------------------------------------------

function renderSiteHeader(site: SiteInfo): string {
  const name = site.name || "Spekta";
  const descHtml = site.description
    ? `\n      <p class="site-header__description">${esc(site.description)}</p>`
    : "";
  return `<header class="site-header">
      <div class="site-header__inner">
        <h1 class="site-header__name">${esc(name)}</h1>${descHtml}
      </div>
    </header>`;
}

// ---------------------------------------------------------------------------
// Site Footer
// ---------------------------------------------------------------------------

function renderSiteFooter(site: SiteInfo): string {
  const builtAt = site.builtAt
    ? new Date(site.builtAt).toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const isDev = site.mode === "development";

  const badgeHtml = isDev
    ? `<span class="site-footer__badge">\u958B\u767A\u30B5\u30FC\u30D0\u30FC</span>`
    : "";
  const timeHtml = builtAt
    ? `<span class="site-footer__time">${esc(builtAt)}</span>`
    : "";

  return `<footer class="site-footer">
      <div class="site-footer__inner">
        ${badgeHtml}<span class="site-footer__text">Generated by Spekta</span>${timeHtml}
      </div>
    </footer>`;
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function renderSidebar(
  pages: Page[],
  currentPageId: string,
  searchEntries: SearchEntry[],
): string {
  const navItems = pages.map((page) => {
    const isActive = page.id === currentPageId;
    const activeClass = isActive ? " sidebar__link--active" : "";
    const openAttr = isActive ? " open" : "";

    const chevronSvg = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

    let subtreeHtml = "";
    if (page.sections && page.sections.length > 0) {
      const items = page.sections.map((section) => {
        let childrenHtml = "";
        if (section.sections && section.sections.length > 0) {
          const childItems = section.sections.map((child) => {
            const isLeaf = !child.sections || child.sections.length === 0;
            const leafClass = isLeaf ? " sidebar__sublink--leaf" : "";
            return `<li><a href="/${esc(page.id)}/#${esc(child.id)}" class="sidebar__sublink${leafClass}">${esc(child.title)}</a></li>`;
          }).join("");
          childrenHtml = `<ul class="sidebar__subtree">${childItems}</ul>`;
        }
        return `<li><a href="/${esc(page.id)}/#${esc(section.id)}" class="sidebar__sublink">${esc(section.title)}</a>${childrenHtml}</li>`;
      }).join("");
      subtreeHtml = `<ul class="sidebar__subtree">${items}</ul>`;
    }

    return `<div class="sidebar__section">
          <details${openAttr}>
            <summary>
              <a href="/${esc(page.id)}/" class="sidebar__link sidebar__link--top${activeClass}">
                <span class="sidebar__link-label">${esc(page.title)}</span>
                <span class="sidebar__toggle">${chevronSvg}</span>
              </a>
            </summary>
            ${subtreeHtml}
          </details>
        </div>`;
  }).join("\n        ");

  return `<aside class="sidebar" id="sidebar">
      <div class="sidebar__header">
        <div class="sidebar__label">\u76EE\u6B21</div>
      </div>
      <div class="sidebar__search">
        <div class="search">
          <input type="text" class="search__input" id="spekta-search" placeholder="\u691C\u7D22..." />
          <div class="search__results" id="spekta-search-results"></div>
        </div>
      </div>
      <nav class="sidebar__nav">
        ${navItems}
      </nav>
    </aside>`;
}

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

function renderPageContent(
  page: Page,
  allPages: Page[],
  pageById: Map<string, Page>,
  imagePaths: string[],
): string {
  const parts: string[] = [];

  parts.push(`<div class="spec-content">`);
  parts.push(`  <h1 class="spec-content__title">${esc(page.title)}</h1>`);

  // Page-level attributes
  const summary = page.attributes?.find((a) => a.type === "summary");
  const seeRefs = page.attributes?.filter((a) => a.type === "see") ?? [];
  const imageAttr = page.attributes?.find((a) => a.type === "image");
  const graphAttr = page.attributes?.find((a) => a.type === "graph");

  if (summary?.text) {
    parts.push(`  <p class="spec-content__summary">${esc(summary.text)}</p>`);
  }

  if (seeRefs.length > 0) {
    const links = seeRefs
      .map((attr) => {
        const refPage = pageById.get(attr.ref ?? "");
        if (!refPage) return "";
        return `<a href="/${esc(refPage.id)}/" class="spec-content__related-link">${esc(refPage.title)}</a>`;
      })
      .filter((l) => l !== "")
      .join(" ");
    if (links) {
      parts.push(`  <div class="spec-content__related">`);
      parts.push(`    <span class="spec-content__related-label">\u95A2\u9023:</span>`);
      parts.push(`    ${links}`);
      parts.push(`  </div>`);
    }
  }

  if (imageAttr?.text) {
    imagePaths.push(imageAttr.text);
    const filename = path.basename(imageAttr.text);
    parts.push(`  <div class="spec-image">`);
    parts.push(`    <img src="/images/${esc(filename)}" alt="${esc(page.title)}" />`);
    parts.push(`  </div>`);
  }

  if (graphAttr?.text) {
    parts.push(`  <div class="spec-graph">`);
    parts.push(`    <div class="mermaid">${esc(graphAttr.text)}</div>`);
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

// ---------------------------------------------------------------------------
// Section rendering (recursive)
// ---------------------------------------------------------------------------

function renderSection(
  section: Section,
  depth: number,
  allPages: Page[],
  pageById: Map<string, Page>,
  imagePaths: string[],
): string {
  const depthClass = `spec-group--depth-${Math.min(depth, 4)}`;
  const headingLevel = Math.min(depth + 1, 5);
  const headingTag = `h${headingLevel}`;

  const summary = section.attributes?.find((a) => a.type === "summary");
  const whyAttr = section.attributes?.find((a) => a.type === "why");
  const seeAttrs = section.attributes?.filter((a) => a.type === "see") ?? [];
  const imageAttr = section.attributes?.find((a) => a.type === "image");
  const graphAttr = section.attributes?.find((a) => a.type === "graph");

  const parts: string[] = [];

  parts.push(`<div class="spec-group ${depthClass}" id="${esc(section.id)}">`);
  parts.push(`  <div class="spec-group__header">`);
  parts.push(`    <${headingTag} class="spec-group__heading">${esc(section.title)}</${headingTag}>`);

  if (summary?.text) {
    parts.push(`    <p class="spec-group__summary">${esc(summary.text)}</p>`);
  }

  // Section-level see links
  if (seeAttrs.length > 0) {
    const links = seeAttrs
      .map((attr) => {
        const refPage = pageById.get(attr.ref ?? "");
        if (!refPage) return "";
        return `<a href="/${esc(refPage.id)}/" class="spec-group__related-link">${esc(refPage.title)}</a>`;
      })
      .filter((l) => l !== "")
      .join(" ");
    if (links) {
      parts.push(`    <div class="spec-group__related">`);
      parts.push(`      <span class="spec-group__related-label">\u95A2\u9023:</span>`);
      parts.push(`      ${links}`);
      parts.push(`    </div>`);
    }
  }

  parts.push(`  </div>`);

  // Why callout
  if (whyAttr?.text) {
    parts.push(`  <div class="spec-callout--why">`);
    parts.push(`    <div class="spec-callout__label">\u306A\u305C\uFF1F</div>`);
    parts.push(`    <div class="spec-callout__text">${esc(whyAttr.text)}</div>`);
    parts.push(`  </div>`);
  }

  // Image
  if (imageAttr?.text) {
    imagePaths.push(imageAttr.text);
    const filename = path.basename(imageAttr.text);
    parts.push(`  <div class="spec-image">`);
    parts.push(`    <img src="/images/${esc(filename)}" alt="${esc(section.title)}" />`);
    parts.push(`  </div>`);
  }

  // Graph
  if (graphAttr?.text) {
    parts.push(`  <div class="spec-graph">`);
    parts.push(`    <div class="mermaid">${esc(graphAttr.text)}</div>`);
    parts.push(`  </div>`);
  }

  // Steps
  if (section.steps && section.steps.length > 0) {
    parts.push(`  <ol class="spec-example__steps">`);
    for (const step of section.steps) {
      parts.push(`    <li>${esc(stepToPhrase(step))}</li>`);
    }
    parts.push(`  </ol>`);
  }

  // Nested sections
  if (section.sections && section.sections.length > 0) {
    parts.push(`  <div class="spec-group__children">`);
    for (const child of section.sections) {
      parts.push(renderSection(child, depth + 1, allPages, pageById, imagePaths));
    }
    parts.push(`  </div>`);
  }

  parts.push(`</div>`);
  return parts.join("\n");
}

// ExporterPlugin interface
const plugin = {
  name: "web",
  defaultOutputDir: "web",
  export(ir: BehaviorIR, config: Record<string, unknown>, outputDir: string): void {
    const siteInfo: SiteInfo = {
      name: config.name as string | undefined,
      description: config.description as string | undefined,
      builtAt: new Date().toISOString(),
    };
    renderWeb(ir, siteInfo, outputDir);
  },
  commands: {
    async dev(config: any): Promise<void> {
      const { dev } = await import("./dev.js");
      await dev(config);
    },
  },
};

export default plugin;
