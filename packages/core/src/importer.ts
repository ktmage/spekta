import * as fs from "node:fs";
import type { Annotation } from "./plugin.js";

const SPEKTA_PATTERN = /^\s*(?:\/\/|#)\s*\[spekta:\w+\]/;

/**
 * Write annotations as [spekta:*] comments into a file.
 * Existing auto-generated [spekta:*] comments (page, section, step) are replaced.
 * Hand-written comments (summary, why, see, image, graph) are preserved.
 */
export function importAnnotations(filePath: string, annotations: Annotation[]): void {
  const source = fs.readFileSync(filePath, "utf-8");
  const result = mergeAnnotations(source, annotations, getCommentPrefix(filePath));
  fs.writeFileSync(filePath, result);
}

const AUTO_GENERATED_TYPES = new Set(["page", "section", "step"]);

/**
 * Merge annotations into source code.
 * - Removes existing auto-generated [spekta:*] comments (page, section, step)
 * - Preserves hand-written comments (summary, why, see, image, graph)
 * - Inserts new annotations at the correct positions
 */
export function mergeAnnotations(source: string, annotations: Annotation[], commentPrefix: string): string {
  const lines = source.split("\n");

  // Step 1: Build a map from original line number → content (before any removal)
  // and record which lines are auto-generated spekta comments to remove
  const linesToRemove = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\s*(?:\/\/|#)\s*\[spekta:(\w+)\]/);
    if (match && AUTO_GENERATED_TYPES.has(match[1])) {
      linesToRemove.add(i);
    }
  }

  // Step 2: Remove auto-generated comments and build line number mapping
  // originalLine → newLine (after removal)
  const cleaned: string[] = [];
  const lineMap = new Map<number, number>(); // original 1-based → new 1-based
  for (let i = 0; i < lines.length; i++) {
    if (linesToRemove.has(i)) continue;
    lineMap.set(i + 1, cleaned.length + 1);
    cleaned.push(lines[i]);
  }

  // For lines after the end, map to the end
  for (let i = 0; i < lines.length; i++) {
    if (!lineMap.has(i + 1)) {
      // Find the next mapped line
      for (let j = i + 1; j <= lines.length; j++) {
        if (lineMap.has(j + 1)) {
          lineMap.set(i + 1, lineMap.get(j + 1)!);
          break;
        }
      }
    }
  }

  // Step 3: Insert annotations (sorted by mapped line, descending for bottom-up insertion)
  const mapped = annotations.map(ann => ({
    ...ann,
    mappedLine: lineMap.get(ann.line) ?? ann.line,
  }));
  mapped.sort((a, b) => b.mappedLine - a.mappedLine);

  for (const ann of mapped) {
    const insertAt = Math.max(0, Math.min(ann.mappedLine - 1, cleaned.length));
    // Use the indent of the target line
    const targetLine = cleaned[insertAt] ?? "";
    const indent = targetLine.match(/^(\s*)/)?.[1] ?? "";
    const comment = `${indent}${commentPrefix} [spekta:${ann.type}] ${ann.text}`;
    cleaned.splice(insertAt, 0, comment);
  }

  return cleaned.join("\n");
}

function getCommentPrefix(filePath: string): string {
  if (filePath.endsWith(".rb") || filePath.endsWith(".py")) return "#";
  return "//";
}
