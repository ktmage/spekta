import * as fs from "node:fs";
import * as path from "node:path";
import type { IR, Page } from "@ktmage/spekta";
import { z } from "zod/v4";
import { collectSearchEntries } from "./search.js";
import { pageUrlPath } from "./anchor.js";
import { renderPageHtml, renderRedirectHtml } from "./templates/page.js";
import type { SiteInfo } from "./templates/header.js";

const webExporterConfigSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  path: z.string().optional(),
}).loose();

export function renderWeb(ir: IR, siteInfo: SiteInfo, outputPath: string): void {
  fs.mkdirSync(outputPath, { recursive: true });

  const pageById = new Map<string, Page>();
  for (const page of ir.pages) {
    pageById.set(page.id, page);
  }

  const searchEntries = collectSearchEntries(ir.pages);
  const imagePaths: string[] = [];

  for (const page of ir.pages) {
    const pageHtml = renderPageHtml(page, ir.pages, pageById, siteInfo, searchEntries, imagePaths);
    const pageDir = path.join(outputPath, page.type, page.title);
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, "index.html"), pageHtml, "utf-8");
  }

  if (ir.pages.length > 0) {
    const firstPage = ir.pages[0];
    fs.writeFileSync(path.join(outputPath, "index.html"), renderRedirectHtml(pageUrlPath(firstPage)), "utf-8");
  }

  fs.writeFileSync(path.join(outputPath, "404.html"), renderRedirectHtml("/"), "utf-8");

  if (imagePaths.length > 0) {
    const imagesDir = path.join(outputPath, "images");
    fs.mkdirSync(imagesDir, { recursive: true });
    for (const imagePath of imagePaths) {
      const sourcePath = path.resolve(imagePath);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, path.join(imagesDir, path.basename(imagePath)));
      }
    }
  }
}

// ExporterPlugin interface
const plugin = {
  name: "web",
  defaultOutputDir: "web",
  configSchema: webExporterConfigSchema,
  export(ir: IR, config: Record<string, unknown>, outputDir: string): void {
    const webConfig = webExporterConfigSchema.parse(config);
    const siteInfo: SiteInfo = {
      name: webConfig.name,
      description: webConfig.description,
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
