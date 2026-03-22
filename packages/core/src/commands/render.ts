import * as path from "node:path";
import type { SpektaConfig, BehaviorIR, SiteInfo } from "../schema/types.js";
import type { ExporterPlugin } from "../schema/plugin.js";
import { parseFiles } from "../core/parser.js";
import { resolveRefs, buildPageTitleToIdMap } from "../core/resolve-refs.js";
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
 *   3. Exporter plugins write IR → Document
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

  const pageTitleToIdMap = buildPageTitleToIdMap(pages);
  resolveRefs(pages, fileToPages, pageTitleToIdMap);

  const ir: BehaviorIR = { version: "1.0.0", pages };

  await runExporters(config, ir, options);

  console.log("Render complete.");
}

function getExporterEntries(config: SpektaConfig): Array<{ name: string; exporterConfig: Record<string, unknown> }> {
  // New format: exporter section
  const exporterRaw = config.exporter;
  if (exporterRaw) {
    return Object.entries(exporterRaw).map(([name, exporterConfig]) => ({
      name,
      exporterConfig: (exporterConfig ?? {}) as Record<string, unknown>,
    }));
  }

  // Legacy format: renderer section
  const entries: Array<{ name: string; exporterConfig: Record<string, unknown> }> = [];
  if (config.renderer.web) entries.push({ name: "web", exporterConfig: config.renderer.web as Record<string, unknown> });
  if (config.renderer.markdown) entries.push({ name: "markdown", exporterConfig: config.renderer.markdown as Record<string, unknown> });
  if (config.renderer.pdf) entries.push({ name: "pdf", exporterConfig: config.renderer.pdf as Record<string, unknown> });
  return entries;
}

async function runExporters(config: SpektaConfig, ir: BehaviorIR, options: RenderOptions): Promise<void> {
  const exporterEntries = getExporterEntries(config);

  const siteInfo: SiteInfo = {
    builtAt: new Date().toISOString(),
    mode: options.mode,
  };

  for (const { name, exporterConfig } of exporterEntries) {
    try {
      const exporterPlugin = await loadExporter(name);
      const outputDir = path.resolve(
        (exporterConfig.path as string | undefined) ?? `.spekta/${name}`,
      );

      // Merge site info from exporter config
      const exporterSiteInfo: SiteInfo = {
        ...siteInfo,
        name: exporterConfig.name as string | undefined,
        description: exporterConfig.description as string | undefined,
      };

      exporterPlugin.export(ir, exporterConfig, outputDir, exporterSiteInfo);
      console.log(`Exporter "${name}" output: ${outputDir}/`);
    } catch (err: any) {
      console.error(`Exporter "${name}" failed: ${err.message}`);
    }
  }
}

async function loadExporter(name: string): Promise<ExporterPlugin> {
  // If it's a full package name (starts with @), resolve from CWD
  if (name.startsWith("@")) {
    try {
      const { createRequire } = await import("node:module");
      const localRequire = createRequire(path.resolve("package.json"));
      const resolved = localRequire.resolve(name);
      const exporterModule = await import(resolved);
      return exporterModule.default as ExporterPlugin;
    } catch {
      throw new Error(`Exporter plugin "${name}" not found. Install it to your project.`);
    }
  }

  // Built-in exporter: resolve from packages/exporters/{name}/dist/render.js
  const exporterPath = path.resolve(import.meta.dirname ?? ".", `../../../exporters/${name}/dist/render.js`);
  try {
    const exporterModule = await import(exporterPath);
    // Wrap legacy renderer into ExporterPlugin interface
    return wrapLegacyExporter(name, exporterModule);
  } catch {
    throw new Error(`Exporter "${name}" not available.`);
  }
}

function wrapLegacyExporter(name: string, mod: any): ExporterPlugin {
  return {
    name,
    export(ir, config, outputDir, siteInfo) {
      if (mod.renderWeb) {
        mod.renderWeb(ir, siteInfo, outputDir);
      } else if (mod.renderMarkdown) {
        mod.renderMarkdown(ir, outputDir);
      } else if (mod.renderPdf) {
        mod.renderPdf(ir, outputDir);
      }
    },
  };
}
