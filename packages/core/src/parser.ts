import * as fs from "node:fs";
import * as crypto from "node:crypto";
import type { Page, Section, Attribute, Step } from "./schema.js";

const SPEKTA_PATTERN = /^(\s*)(?:\/\/|#)\s*\[spekta:(\w+)\]\s*(.*)/;

interface CommentEntry {
  indent: number;
  type: string;
  text: string;
  line: number;
}

function generateId(...parts: string[]): string {
  return crypto.createHash("sha256").update(parts.join("/")).digest("hex").slice(0, 8);
}

/**
 * Parse a single file's [spekta:*] comments into pages.
 * Language-agnostic: only reads comment patterns, doesn't understand any DSL.
 */
export function parseFile(filePath: string): Page[] {
  const source = fs.readFileSync(filePath, "utf-8");
  return parseSource(filePath, source);
}

export function parseSource(filePath: string, source: string): Page[] {
  const entries = extractComments(source);
  return buildPages(filePath, entries);
}

function extractComments(source: string): CommentEntry[] {
  const entries: CommentEntry[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(SPEKTA_PATTERN);
    if (!match) continue;

    const indent = match[1].length;
    const type = match[2];
    const textLines: string[] = [];
    if (match[3]) textLines.push(match[3]);

    // Multi-line for graph
    if (type === "graph") {
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextMatch = nextLine.match(/^\s*(?:\/\/|#)\s*(.*)/);
        if (!nextMatch) break;
        if (nextMatch[1].match(/\[spekta:\w+\]/)) break;
        textLines.push(nextMatch[1]);
        j++;
      }
    }

    entries.push({
      indent,
      type,
      text: textLines.join("\n"),
      line: i + 1,
    });
  }

  return entries;
}

function buildPages(filePath: string, entries: CommentEntry[]): Page[] {
  const pages: Page[] = [];
  let currentPage: Page | null = null;
  // Stack of (section, indent) for nesting
  const sectionStack: { section: Section; indent: number }[] = [];
  // Pending attributes before a page is declared
  let pendingAttrs: Attribute[] = [];

  for (const entry of entries) {
    if (entry.type === "page") {
      // Start a new page
      currentPage = {
        id: generateId(filePath, entry.text),
        type: "feature",
        title: entry.text,
      };
      // Attach pending attributes (summary, why, etc. that appeared before this page)
      if (pendingAttrs.length > 0) {
        currentPage.attributes = pendingAttrs;
        pendingAttrs = [];
      }
      pages.push(currentPage);
      sectionStack.length = 0;
      continue;
    }

    if (entry.type === "section") {
      const section: Section = {
        id: generateId(filePath, entry.text, String(entry.line)),
        title: entry.text,
      };

      // Pop stack until we find a parent with less indent
      while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].indent >= entry.indent) {
        sectionStack.pop();
      }

      if (sectionStack.length > 0) {
        // Nested section
        const parent = sectionStack[sectionStack.length - 1].section;
        if (!parent.sections) parent.sections = [];
        parent.sections.push(section);
      } else if (currentPage) {
        // Direct child of page
        if (!currentPage.sections) currentPage.sections = [];
        currentPage.sections.push(section);
      }

      sectionStack.push({ section, indent: entry.indent });
      continue;
    }

    if (entry.type === "step") {
      const step: Step = { action: "other", target: entry.text };
      // Add to most recent section
      if (sectionStack.length > 0) {
        const current = sectionStack[sectionStack.length - 1].section;
        if (!current.steps) current.steps = [];
        current.steps.push(step);
      }
      continue;
    }

    // Attributes: summary, why, see, image, graph
    const attr: Attribute = { type: entry.type as Attribute["type"] };
    if (entry.type === "see") {
      attr.ref = entry.text;
    } else {
      attr.text = entry.text;
    }

    // Attach to most recent section, or page
    if (sectionStack.length > 0) {
      const current = sectionStack[sectionStack.length - 1].section;
      if (!current.attributes) current.attributes = [];
      current.attributes.push(attr);
    } else if (currentPage) {
      if (!currentPage.attributes) currentPage.attributes = [];
      currentPage.attributes.push(attr);
    } else {
      // No page yet — save as pending for the next page
      pendingAttrs.push(attr);
    }
  }

  return pages;
}

/**
 * Parse multiple files and collect all pages.
 */
export function parseFiles(filePaths: string[]): { pages: Page[]; fileToPages: Map<string, Page[]> } {
  const allPages: Page[] = [];
  const fileToPages = new Map<string, Page[]>();

  for (const filePath of filePaths) {
    const pages = parseFile(filePath);
    allPages.push(...pages);
    fileToPages.set(filePath, pages);
  }

  return { pages: allPages, fileToPages };
}
