import * as path from "node:path";
import type { SpektaConfig, BehaviorIR, SiteInfo } from "./types.js";
import { parseAll } from "./parser.js";
import { resolveRefs, buildTitleToIdMap } from "./resolve-refs.js";

export interface RenderOptions {
  mode: "production" | "development";
}

/**
 * Parse test files and export documentation (without annotator step).
 */
export async function render(config: SpektaConfig, options: RenderOptions): Promise<void> {
  const specDir = path.resolve(config.spec_dir);

  console.log(`Analyzing spec files in: ${specDir}`);

  const { pages, fileToPages } = parseAll(config);

  if (pages.length === 0) {
    console.warn("No pages found. Check your spec files and configuration.");
    return;
  }

  console.log(`Found ${pages.length} page(s).`);

  const titleToId = buildTitleToIdMap(pages);
  resolveRefs(pages, fileToPages, titleToId);

  const ir: BehaviorIR = { version: "1.0.0", pages };

  await runExporters(config, ir, options);

  console.log("Build complete.");
}

async function runExporters(config: SpektaConfig, ir: BehaviorIR, options: RenderOptions): Promise<void> {
  // Web exporter
  if (config.renderer.web) {
    const webPath = path.resolve(config.renderer.web.path ?? ".spekta/web");
    const exporterDir = path.resolve(import.meta.dirname ?? ".", "../../exporters/web/dist/render.js");
    try {
      const { renderWeb } = await import(exporterDir);
      const siteInfo: SiteInfo = {
        name: config.renderer.web.name,
        description: config.renderer.web.description,
        builtAt: new Date().toISOString(),
        mode: options.mode,
      };
      renderWeb(ir, siteInfo, webPath);
      console.log(`Web renderer output: ${webPath}/`);
    } catch {
      console.error(`Web exporter not built. Run: cd packages/exporters/web && bun run build`);
    }
  }

  // Markdown exporter
  if (config.renderer.markdown) {
    const mdPath = path.resolve(config.renderer.markdown.path ?? ".spekta/markdown");
    const exporterDir = path.resolve(import.meta.dirname ?? ".", "../../exporters/markdown/dist/render.js");
    try {
      const { renderMarkdown } = await import(exporterDir);
      renderMarkdown(ir, mdPath);
      console.log(`Markdown renderer output: ${mdPath}/`);
    } catch {
      console.error(`Markdown exporter not built. Run: cd packages/exporters/markdown && bun run build`);
    }
  }

  // PDF exporter
  if (config.renderer.pdf) {
    const pdfPath = path.resolve(config.renderer.pdf.path ?? ".spekta/pdf");
    const exporterDir = path.resolve(import.meta.dirname ?? ".", "../../exporters/pdf/dist/render.js");
    try {
      const { renderPdf } = await import(exporterDir);
      renderPdf(ir, pdfPath);
      console.log(`PDF renderer output: ${pdfPath}/`);
    } catch {
      console.error(`PDF exporter not built. Run: cd packages/exporters/pdf && bun run build`);
    }
  }
}
