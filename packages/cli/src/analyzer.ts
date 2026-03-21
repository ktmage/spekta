import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync, execSync } from "node:child_process";
import type { Page, SpektaConfig } from "./types.js";

/**
 * Analyze all configured analyzers and return pages.
 */
export function analyzeAll(
  config: SpektaConfig,
): { pages: Page[]; fileToPages: Map<string, Page[]> } {
  const allPages: Page[] = [];
  const fileToPages = new Map<string, Page[]>();

  // RSpec analyzer
  if (config.analyzer.rspec) {
    const specDir = path.resolve(config.spec_dir);
    for (const specType of config.analyzer.rspec.spec_types) {
      const files = collectRspecFiles(specDir, specType);
      for (const file of files) {
        const pages = runRspecAnalyzer([file]);
        allPages.push(...pages);
        fileToPages.set(file, pages);
      }
    }
  }

  // Vitest analyzer
  if (config.analyzer.vitest) {
    const specDir = path.resolve(config.analyzer.vitest.spec_dir ?? config.spec_dir);
    const files = collectTestTsFiles(specDir).filter(f => {
      const exclude = config.analyzer.vitest?.exclude ?? [];
      return !exclude.some(pattern => f.includes(pattern));
    });
    for (const file of files) {
      const pages = runVitestAnalyzer([file]);
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

function runRspecAnalyzer(files: string[]): Page[] {
  if (files.length === 0) return [];

  const analyzerBin = path.resolve(
    import.meta.dirname ?? ".",
    "../../analyzers/rspec/bin/spekta-analyze",
  );

  if (!fs.existsSync(analyzerBin)) {
    console.error(`RSpec analyzer not found at: ${analyzerBin}`);
    return [];
  }

  try {
    const stdout = execFileSync("bundle", ["exec", "ruby", analyzerBin, ...files], {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });
    return JSON.parse(stdout) as Page[];
  } catch (err) {
    console.error("Failed to run RSpec analyzer:", err);
    return [];
  }
}

// --- Vitest ---

function collectTestTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return collectFiles(dir, ".test.ts");
}

function runVitestAnalyzer(files: string[]): Page[] {
  if (files.length === 0) return [];

  const analyzerBin = path.resolve(
    import.meta.dirname ?? ".",
    "../../analyzers/vitest/dist/index.js",
  );

  if (!fs.existsSync(analyzerBin)) {
    console.error(`Vitest analyzer not found at: ${analyzerBin}`);
    return [];
  }

  try {
    const stdout = execSync(`node ${analyzerBin} ${files.join(" ")}`, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });
    return JSON.parse(stdout) as Page[];
  } catch (err) {
    console.error("Failed to run Vitest analyzer:", err);
    return [];
  }
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
