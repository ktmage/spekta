import * as fs from "node:fs";
import * as path from "node:path";
import type { SpektaConfig } from "../schema/types.js";
import { importAnnotations } from "../core/importer.js";
import { collectFiles } from "../core/files.js";
import { loadAnnotatorPlugin } from "../core/load-plugin.js";

/**
 * Run annotator plugins to auto-complete [spekta:*] comments in test files.
 *
 * Flow:
 *   1. Annotator reads test file → Annotation[]
 *   2. Importer writes Annotation[] as [spekta:*] comments to file
 */
export async function complete(config: SpektaConfig): Promise<void> {
  const annotatorNames = getAnnotatorNames(config);
  if (annotatorNames.length === 0) {
    return;
  }

  for (const name of annotatorNames) {
    try {
      const annotatorPlugin = await loadAnnotatorPlugin(name);
      const targetDir = path.resolve(config.target_dir);
      const files = collectFiles(targetDir, annotatorPlugin.filePatterns);

      for (const file of files) {
        const source = fs.readFileSync(file, "utf-8");
        const annotatorConfig = (config.annotator?.[name] ?? {}) as Record<string, unknown>;
        const annotations = annotatorPlugin.annotate(file, source, annotatorConfig);
        if (annotations.length > 0) {
          importAnnotations(file, annotations);
        }
      }

      console.log(`Annotator "${name}": ${files.length} file(s) processed.`);
    } catch (err: any) {
      console.error(`Failed to load annotator "${name}": ${err.message}`);
    }
  }
}

function getAnnotatorNames(config: SpektaConfig): string[] {
  if (!config.annotator) return [];
  return Object.keys(config.annotator);
}
