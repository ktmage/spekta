import * as path from "node:path";
import type { SpektaConfig, BehaviorIR, SiteInfo } from "./types.js";
import { analyzeAll } from "./analyzer.js";
import { resolveRefs, buildTitleToIdMap } from "./resolve-refs.js";

export interface BuildOptions {
  mode: "production" | "development";
}

export async function build(config: SpektaConfig, options: BuildOptions): Promise<void> {
  const specDir = path.resolve(config.spec_dir);

  console.log(`Analyzing spec files in: ${specDir}`);

  const { pages, fileToPages } = analyzeAll(config);

  if (pages.length === 0) {
    console.warn("No pages found. Check your spec files and configuration.");
    return;
  }

  console.log(`Found ${pages.length} page(s).`);

  const titleToId = buildTitleToIdMap(pages);
  resolveRefs(pages, fileToPages, titleToId);

  const ir: BehaviorIR = { version: "1.0.0", pages };

  // Web renderer
  if (config.renderer.web) {
    const webPath = path.resolve(config.renderer.web.path ?? ".spekta/web");
    const rendererDir = path.resolve(import.meta.dirname ?? ".", "../../renderers/web/dist/render.js");
    try {
      const { renderWeb } = await import(rendererDir);
      const siteInfo: SiteInfo = {
        name: config.renderer.web.name,
        description: config.renderer.web.description,
        builtAt: new Date().toISOString(),
        mode: options.mode,
      };
      renderWeb(ir, siteInfo, webPath);
      console.log(`Web renderer output: ${webPath}/`);
    } catch {
      console.error(`Web renderer not built. Run: cd packages/renderers/web && npm run build`);
    }
  }

  // Markdown renderer
  if (config.renderer.markdown) {
    const mdPath = path.resolve(config.renderer.markdown.path ?? ".spekta/markdown");
    const rendererDir = path.resolve(import.meta.dirname ?? ".", "../../renderers/markdown/dist/render.js");
    try {
      const { renderMarkdown } = await import(rendererDir);
      renderMarkdown(ir, mdPath);
      console.log(`Markdown renderer output: ${mdPath}/`);
    } catch {
      console.error(`Markdown renderer not built. Run: cd packages/renderers/markdown && npm run build`);
    }
  }

  // PDF renderer
  if (config.renderer.pdf) {
    const pdfPath = path.resolve(config.renderer.pdf.path ?? ".spekta/pdf");
    const rendererDir = path.resolve(import.meta.dirname ?? ".", "../../renderers/pdf/dist/render.js");
    try {
      const { renderPdf } = await import(rendererDir);
      renderPdf(ir, pdfPath);
      console.log(`PDF renderer output: ${pdfPath}/`);
    } catch {
      console.error(`PDF renderer not built. Run: cd packages/renderers/pdf && npm run build`);
    }
  }

  console.log("Build complete.");
}

