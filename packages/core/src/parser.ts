import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import type { Page, SpektaConfig } from "./types.js";
import { parseFile as parseTypescriptFile } from "./parsers/typescript.js";

/**
 * Parse all configured spec files and return pages.
 */
export function parseAll(
  config: SpektaConfig,
): { pages: Page[]; fileToPages: Map<string, Page[]> } {
  const allPages: Page[] = [];
  const fileToPages = new Map<string, Page[]>();

  // RSpec parser
  if (config.analyzer.rspec) {
    const specDir = path.resolve(config.spec_dir);
    for (const specType of config.analyzer.rspec.spec_types) {
      const files = collectRspecFiles(specDir, specType);
      for (const file of files) {
        const pages = parseRspecFile(file);
        allPages.push(...pages);
        fileToPages.set(file, pages);
      }
    }
  }

  // TypeScript parser (for Vitest / Jest / etc.)
  if (config.analyzer.vitest) {
    const specDir = path.resolve(config.analyzer.vitest.spec_dir ?? config.spec_dir);
    const files = collectTestTsFiles(specDir).filter(f => {
      const exclude = config.analyzer.vitest?.exclude ?? [];
      return !exclude.some(pattern => f.includes(pattern));
    });
    for (const file of files) {
      const pages = parseTypescriptFile(file);
      allPages.push(...pages);
      fileToPages.set(file, pages);
    }
  }

  return { pages: allPages, fileToPages };
}

// --- RSpec ---

function collectRspecFiles(specDir: string, specType: string): string[] {
  const subDirs: Record<string, string> = {
    feature_spec: "features",
    system_spec: "system",
  };
  const subDir = subDirs[specType];
  if (!subDir) return [];

  const dir = path.join(specDir, subDir);
  if (!fs.existsSync(dir)) return [];

  return collectFiles(dir, ".rb");
}

function parseRspecFile(file: string): Page[] {
  // TODO: Replace with text-based TypeScript parser (remove Ruby dependency)
  const analyzerBin = path.resolve(
    import.meta.dirname ?? ".",
    "../../analyzers/rspec/bin/spekta-analyze",
  );

  if (!fs.existsSync(analyzerBin)) {
    return [];
  }

  try {
    const stdout = execFileSync("bundle", ["exec", "ruby", analyzerBin, file], {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });
    return JSON.parse(stdout) as Page[];
  } catch {
    return [];
  }
}

// --- TypeScript ---

function collectTestTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return collectFiles(dir, ".test.ts");
}

// --- Common ---

function collectFiles(dir: string, ext: string): string[] {
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
