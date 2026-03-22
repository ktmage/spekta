import * as fs from "node:fs";
import * as path from "node:path";
import type { SpektaConfig, BehaviorIR, SiteInfo } from "./types.js";
import { parseFiles } from "./parser.js";
import { resolveRefs, buildTitleToIdMap } from "./resolve-refs.js";

export interface RenderOptions {
  mode: "production" | "development";
}

/**
 * Parse [spekta:*] comments from spec files and export documentation.
 *
 * Flow:
 *   1. Collect spec files from config
 *   2. Parser reads [spekta:*] comments → IR
 *   3. Exporter writes IR → Document
 */
export async function render(config: SpektaConfig, options: RenderOptions): Promise<void> {
  const filePaths = collectSpecFiles(config);

  if (filePaths.length === 0) {
    console.warn("No spec files found. Check your configuration.");
    return;
  }

  console.log(`Parsing ${filePaths.length} spec file(s)...`);

  const { pages, fileToPages } = parseFiles(filePaths);

  if (pages.length === 0) {
    console.warn("No [spekta:*] annotations found. Run 'spekta complete' first or add comments manually.");
    return;
  }

  console.log(`Found ${pages.length} page(s).`);

  const titleToId = buildTitleToIdMap(pages);
  resolveRefs(pages, fileToPages, titleToId);

  const ir: BehaviorIR = { version: "1.0.0", pages };

  await runExporters(config, ir, options);

  console.log("Build complete.");
}

function collectSpecFiles(config: SpektaConfig): string[] {
  const specDir = path.resolve(config.spec_dir);
  const extensions = [".test.ts", ".spec.ts", "_spec.rb"];
  const exclude = config.analyzer?.vitest?.exclude ?? [];

  const files: string[] = [];
  for (const ext of extensions) {
    files.push(...collectFiles(specDir, ext));
  }

  return files.filter(f => !exclude.some(pattern => f.includes(pattern)));
}

function collectFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      files.push(...collectFiles(fullPath, ext));
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function runExporters(config: SpektaConfig, ir: BehaviorIR, options: RenderOptions): Promise<void> {
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
      console.log(`Web exporter output: ${webPath}/`);
    } catch {
      console.error(`Web exporter not built. Run: cd packages/exporters/web && bun run build`);
    }
  }

  if (config.renderer.markdown) {
    const mdPath = path.resolve(config.renderer.markdown.path ?? ".spekta/markdown");
    const exporterDir = path.resolve(import.meta.dirname ?? ".", "../../exporters/markdown/dist/render.js");
    try {
      const { renderMarkdown } = await import(exporterDir);
      renderMarkdown(ir, mdPath);
      console.log(`Markdown exporter output: ${mdPath}/`);
    } catch {
      console.error(`Markdown exporter not built. Run: cd packages/exporters/markdown && bun run build`);
    }
  }

  if (config.renderer.pdf) {
    const pdfPath = path.resolve(config.renderer.pdf.path ?? ".spekta/pdf");
    const exporterDir = path.resolve(import.meta.dirname ?? ".", "../../exporters/pdf/dist/render.js");
    try {
      const { renderPdf } = await import(exporterDir);
      renderPdf(ir, pdfPath);
      console.log(`PDF exporter output: ${pdfPath}/`);
    } catch {
      console.error(`PDF exporter not built.`);
    }
  }
}
