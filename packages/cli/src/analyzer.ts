import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import type { Page } from "./types.js";

/**
 * Collect spec files for the given spec type under the spec directory.
 */
export function collectSpecFiles(
  specDir: string,
  specType: string,
): string[] {
  let subDir: string;

  switch (specType) {
    case "feature_spec":
      subDir = "features";
      break;
    case "system_spec":
      subDir = "system";
      break;
    default:
      console.warn(`Unknown spec type: ${specType}`);
      return [];
  }

  const dir = path.join(specDir, subDir);
  if (!fs.existsSync(dir)) {
    return [];
  }

  return collectRbFiles(dir);
}

/**
 * Recursively collect all .rb files under a directory.
 */
function collectRbFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRbFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".rb")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

/**
 * Run the RSpec analyzer on the given files and return parsed pages.
 * Calls the Ruby analyzer entry point as a subprocess.
 */
export function analyzeFiles(files: string[]): Page[] {
  if (files.length === 0) {
    return [];
  }

  // Locate the analyzer bin relative to this package
  const analyzerBin = path.resolve(
    import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname),
    "../../analyzers/rspec/bin/spekta-analyze",
  );

  if (!fs.existsSync(analyzerBin)) {
    console.error(`Analyzer not found at: ${analyzerBin}`);
    console.error("Make sure @spekta/analyzers/rspec is installed.");
    process.exit(1);
  }

  try {
    // Use bundle exec to ensure correct Ruby version and dependencies
    const stdout = execFileSync("bundle", ["exec", "ruby", analyzerBin, ...files], {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });

    const pages = JSON.parse(stdout) as Page[];
    return pages;
  } catch (err) {
    console.error("Failed to run RSpec analyzer:", err);
    return [];
  }
}

/**
 * Analyze all spec files for the given spec types and return pages,
 * along with a mapping from file paths to pages (for reference resolution).
 */
export function analyzeAll(
  specDir: string,
  specTypes: string[],
): { pages: Page[]; fileToPages: Map<string, Page[]> } {
  const allPages: Page[] = [];
  const fileToPages = new Map<string, Page[]>();

  for (const specType of specTypes) {
    const files = collectSpecFiles(specDir, specType);

    for (const file of files) {
      const pages = analyzeFiles([file]);
      allPages.push(...pages);
      fileToPages.set(file, pages);
    }
  }

  return { pages: allPages, fileToPages };
}
