import * as path from "node:path";
import type { SpektaConfig, BehaviorIR } from "../schema/types.js";
import type { ExporterPlugin } from "../schema/plugin.js";
import { parseFiles } from "../core/parser.js";
import { resolveRefs, buildPageTitleToIdMap } from "../core/resolve-refs.js";
import { collectFiles, collectAllFiles } from "../core/files.js";
import { loadPluginModule } from "../core/load-plugin.js";

/**
 * Parse [spekta:*] comments from test files and export documentation.
 *
 * Flow:
 *   1. Collect test files from config
 *   2. Parser reads [spekta:*] comments → IR
 *   3. Exporter plugins write IR → Document
 */
export async function render(config: SpektaConfig): Promise<void> {
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

  await runExporters(config, ir);

  console.log("Render complete.");
}

function getExporterEntries(config: SpektaConfig): Array<{ name: string; exporterConfig: Record<string, unknown> }> {
  if (!config.exporter) return [];
  return Object.entries(config.exporter).map(([name, exporterConfig]) => ({
    name,
    exporterConfig: (exporterConfig ?? {}) as Record<string, unknown>,
  }));
}

async function runExporters(config: SpektaConfig, ir: BehaviorIR): Promise<void> {
  const exporterEntries = getExporterEntries(config);

  for (const { name, exporterConfig } of exporterEntries) {
    try {
      const exporterPlugin = await loadExporter(name);
      const outputDir = path.resolve(
        (exporterConfig.path as string | undefined) ?? `.spekta/${exporterPlugin.defaultOutputDir}`,
      );
      exporterPlugin.export(ir, exporterConfig, outputDir);
      console.log(`Exporter "${name}" output: ${outputDir}/`);
    } catch (err: any) {
      console.error(`Exporter "${name}" failed: ${err.message}`);
    }
  }
}

async function loadExporter(name: string): Promise<ExporterPlugin> {
  try {
    return await loadPluginModule(name) as ExporterPlugin;
  } catch {
    throw new Error(`Exporter plugin "${name}" not found. Install it to your project.`);
  }
}
