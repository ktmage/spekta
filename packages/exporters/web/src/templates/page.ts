import * as fs from "node:fs";
import * as path from "node:path";
import type { Page } from "@ktmage/spekta";
import { escapeHtml } from "../html.js";
import type { SearchEntry } from "../search.js";
import type { SiteInfo } from "./header.js";
import { renderSiteHeader } from "./header.js";
import { renderSiteFooter } from "./footer.js";
import { renderSidebar } from "./sidebar.js";
import { renderPageContent } from "./content.js";

function loadAsset(filename: string): string {
  return fs.readFileSync(path.resolve(import.meta.dirname ?? ".", `../${filename}`), "utf-8");
}

export function renderPageHtml(
  page: Page,
  allPages: Page[],
  pageById: Map<string, Page>,
  siteInfo: SiteInfo,
  searchEntries: SearchEntry[],
  imagePaths: string[],
): string {
  const embeddedCss = loadAsset("style.css");
  const inlineJs = loadAsset("client.js");

  const siteName = siteInfo.name || "Spekta";
  const title = `${escapeHtml(page.title)} - ${escapeHtml(siteName)}`;

  const sidebarHtml = renderSidebar(allPages, page.id, searchEntries);
  const contentHtml = renderPageContent(page, allPages, pageById, imagePaths);
  const headerHtml = renderSiteHeader(siteInfo);
  const footerHtml = renderSiteFooter(siteInfo);

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${embeddedCss}</style>
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
    <button class="menu-toggle" id="menu-toggle" aria-label="メニューを開く">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
    <script id="spekta-search-data" type="application/json">${JSON.stringify(searchEntries)}</script>
    <script>${inlineJs}</script>
  </body>
</html>
`;
}

export function renderRedirectHtml(url: string): string {
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(url)}" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <title>リダイレクト中...</title>
  </head>
  <body>
    <p><a href="${escapeHtml(url)}">こちらをクリックしてください</a></p>
  </body>
</html>
`;
}
