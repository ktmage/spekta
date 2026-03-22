import * as fs from "node:fs";
import * as path from "node:path";
import type { SpektaConfig } from "../schema/types.js";
import type { AnnotatorPlugin } from "../schema/plugin.js";
import { importAnnotations } from "../core/importer.js";

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
      const annotatorPlugin = await loadAnnotator(name);
      const targetDir = path.resolve(config.target_dir);
      const files = collectFiles(targetDir, annotatorPlugin.filePatterns);

      for (const file of files) {
        const source = fs.readFileSync(file, "utf-8");
        const annotations = annotatorPlugin.annotate(file, source);
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
  // Read from annotator section in config
  const raw = config as unknown as Record<string, unknown>;
  const annotator = raw.annotator as Record<string, unknown> | undefined;
  if (!annotator) return [];
  return Object.keys(annotator);
}

async function loadAnnotator(name: string): Promise<AnnotatorPlugin> {
  try {
    // Resolve from CWD so plugins installed in the project's node_modules are found
    const { createRequire } = await import("node:module");
    const require = createRequire(path.resolve("package.json"));
    const resolved = require.resolve(name);
    const annotatorModule = await import(resolved);
    return annotatorModule.default as AnnotatorPlugin;
  } catch {
    throw new Error(`Annotator plugin "${name}" not found. Install it to your project.`);
  }
}

function collectFiles(dir: string, patterns: string[]): string[] {
  if (!fs.existsSync(dir)) return [];

  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      files.push(...collectFiles(fullPath, patterns));
    } else if (entry.isFile() && matchesPatterns(entry.name, patterns)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

function matchesPatterns(fileName: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    const ext = pattern.replace("*", "");
    return fileName.endsWith(ext);
  });
}
