import { escapeHtml } from "../html.js";

export interface SiteInfo {
  name: string;
  description?: string;
  builtAt?: string;
}

export function renderSiteHeader(siteInfo: SiteInfo): string {
  const descriptionHtml = siteInfo.description
    ? `\n      <p class="site-header__description">${escapeHtml(siteInfo.description)}</p>`
    : "";
  return `<header class="site-header">
      <div class="site-header__inner">
        <h1 class="site-header__name">${escapeHtml(siteInfo.name)}</h1>${descriptionHtml}
      </div>
    </header>`;
}
