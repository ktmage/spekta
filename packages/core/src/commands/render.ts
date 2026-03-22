import * as path from "node:path";
import type { SpektaConfig, BehaviorIR, SiteInfo } from "../schema/types.js";
import { parseFiles } from "../core/parser.js";
import { resolveRefs, buildTitleToIdMap } from "../core/resolve-refs.js";
import { collectFiles, collectAllFiles } from "../core/files.js";

export interface RenderOptions {
  mode: "production" | "development";
}

/**
 * Parse [spekta:*] comments from test files and export documentation.
 *
 * Flow:
 *   1. Collect test files from config
 *   2. Parser reads [spekta:*] comments → IR
 *   3. Exporter writes IR → Document
 */
export async function render(config: SpektaConfig, options: RenderOptions): Promise<void> {
  const targetDir = path.resolve(config.target_dir);
  const filePaths = config.include
    ? collectFiles(targetDir, config.include)
    : collectAllFiles(targetDir);
  const filteredPaths = config.exclude
    ? filePaths.filter(f => !config.exclude!.some(pattern => f.includes(pattern)))
    : filePaths;

  if (filteredPaths.length === 0) {
    console.warn("No test files found. Check your configuration.");
    return;
  }

  console.log(`Parsing ${filteredPaths.length} test file(s)...`);

  const { pages, fileToPages } = parseFiles(filteredPaths);

  if (pages.length === 0) {
    console.warn("No [spekta:*] annotations found. Run 'spekta complete' first or add comments manually.");
    return;
  }

  console.log(`Found ${pages.length} page(s).`);

  const titleToId = buildTitleToIdMap(pages);
  resolveRefs(pages, fileToPages, titleToId);

  const ir: BehaviorIR = { version: "1.0.0", pages };

  await runExporters(config, ir, options);

  console.log("Render complete.");
}

async function runExporters(config: SpektaConfig, ir: BehaviorIR, options: RenderOptions): Promise<void> {
  if (config.renderer.web) {
    const webPath = path.resolve(config.renderer.web.path ?? ".spekta/web");
    const exporterDir = path.resolve(import.meta.dirname ?? ".", "../../../exporters/web/dist/render.js");
    try {
      const { renderWeb } = await import(exporterDir);
      const siteInfo: SiteInfo = {
        name: config.renderer.web.name,
        description: config.renderer.web.description,
        builtAt: new Date().toISOString(),
        mode: options.mode,
      };
      renderWeb(ir, siteInfo, webPath);
      console.log(`Web exporter output: ${webPath}/`);
    } catch {
      console.error(`Web exporter not available.`);
    }
  }

  if (config.renderer.markdown) {
    const mdPath = path.resolve(config.renderer.markdown.path ?? ".spekta/markdown");
    const exporterDir = path.resolve(import.meta.dirname ?? ".", "../../../exporters/markdown/dist/render.js");
    try {
      const { renderMarkdown } = await import(exporterDir);
      renderMarkdown(ir, mdPath);
      console.log(`Markdown exporter output: ${mdPath}/`);
    } catch {
      console.error(`Markdown exporter not available.`);
    }
  }

  if (config.renderer.pdf) {
    const pdfPath = path.resolve(config.renderer.pdf.path ?? ".spekta/pdf");
    const exporterDir = path.resolve(import.meta.dirname ?? ".", "../../../exporters/pdf/dist/render.js");
    try {
      const { renderPdf } = await import(exporterDir);
      renderPdf(ir, pdfPath);
      console.log(`PDF exporter output: ${pdfPath}/`);
    } catch {
      console.error(`PDF exporter not built.`);
    }
  }
}
