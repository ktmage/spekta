import * as fs from "node:fs";
import type { Annotation } from "./plugin.js";

const SPEKTA_PATTERN = /^\s*(?:\/\/|#)\s*\[spekta:\w+\]/;

/**
 * Write annotations as [spekta:*] comments into a file.
 * Existing [spekta:*] comments are removed and replaced with new ones.
 */
export function importAnnotations(filePath: string, annotations: Annotation[]): void {
  const source = fs.readFileSync(filePath, "utf-8");
  const result = mergeAnnotations(source, annotations, getCommentPrefix(filePath));
  fs.writeFileSync(filePath, result);
}

/**
 * Merge annotations into source code, replacing existing [spekta:*] comments.
 */
export function mergeAnnotations(source: string, annotations: Annotation[], commentPrefix: string): string {
  const lines = source.split("\n");

  // Remove existing [spekta:*] comments
  const cleaned = lines.filter(line => !SPEKTA_PATTERN.test(line));

  // Sort annotations by line number (descending) to insert from bottom up
  const sorted = [...annotations].sort((a, b) => b.line - a.line);

  for (const ann of sorted) {
    // Find the right insertion point (before the target line, adjusted for removed lines)
    const insertAt = Math.min(ann.line - 1, cleaned.length);
    const indent = getIndentAt(cleaned, insertAt);
    const comment = `${indent}${commentPrefix} [spekta:${ann.type}] ${ann.text}`;
    cleaned.splice(insertAt, 0, comment);
  }

  return cleaned.join("\n");
}

function getIndentAt(lines: string[], index: number): string {
  if (index >= 0 && index < lines.length) {
    const match = lines[index].match(/^(\s*)/);
    return match ? match[1] : "";
  }
  return "";
}

function getCommentPrefix(filePath: string): string {
  if (filePath.endsWith(".rb") || filePath.endsWith(".py")) return "#";
  return "//";
}
