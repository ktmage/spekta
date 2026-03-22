import * as fs from "node:fs";
import * as crypto from "node:crypto";
import type { Page, Section, Attribute, Step } from "../schema/ir.js";

const SPEKTA_PATTERN = /^(\s*)(?:\/\/|#)\s*\[spekta:(\w+)\]\s*(.*)/;

interface CommentEntry {
  indent: number;
  type: string;
  text: string;
  line: number;
}

function generateId(pathString: string): string {
  return crypto.createHash("sha256").update(pathString).digest("hex");
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
  return buildPages(entries);
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

function buildPages(entries: CommentEntry[]): Page[] {
  const pages: Page[] = [];
  let currentPage: Page | null = null;
  let currentPageTitle = "";
  const sectionStack: { section: Section; indent: number; title: string }[] = [];
  let pendingAttrs: Attribute[] = [];

  for (const entry of entries) {
    if (entry.type === "page") {
      currentPageTitle = entry.text;
      currentPage = {
        id: generateId(currentPageTitle),
        type: "feature",
        title: currentPageTitle,
      };
      if (pendingAttrs.length > 0) {
        currentPage.attributes = pendingAttrs;
        pendingAttrs = [];
      }
      pages.push(currentPage);
      sectionStack.length = 0;
      continue;
    }

    if (entry.type === "section") {
      // Pop stack until we find a parent with less indent
      while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].indent >= entry.indent) {
        sectionStack.pop();
      }

      // Build section path for ID: pageTitle/parent1/parent2/.../sectionTitle
      const sectionPath = [
        currentPageTitle,
        ...sectionStack.map(stackEntry => stackEntry.title),
        entry.text,
      ].join("/");

      const section: Section = {
        id: generateId(sectionPath),
        title: entry.text,
      };

      if (sectionStack.length > 0) {
        const parentSection = sectionStack[sectionStack.length - 1].section;
        if (!parentSection.sections) parentSection.sections = [];
        parentSection.sections.push(section);
      } else if (currentPage) {
        if (!currentPage.sections) currentPage.sections = [];
        currentPage.sections.push(section);
      }

      sectionStack.push({ section, indent: entry.indent, title: entry.text });
      continue;
    }

    if (entry.type === "step") {
      const step: Step = { action: "other", target: entry.text };
      if (sectionStack.length > 0) {
        const currentSection = sectionStack[sectionStack.length - 1].section;
        if (!currentSection.steps) currentSection.steps = [];
        currentSection.steps.push(step);
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

    // Look ahead: if a [spekta:page] follows, this attribute belongs to the next page
    let hasUpcomingPage = false;
    for (let j = entries.indexOf(entry) + 1; j < entries.length; j++) {
      if (entries[j].type === "page") { hasUpcomingPage = true; break; }
      if (entries[j].type === "section" || entries[j].type === "step") break;
    }
    if (hasUpcomingPage) {
      pendingAttrs.push(attr);
      continue;
    }

    if (sectionStack.length > 0) {
      const currentSection = sectionStack[sectionStack.length - 1].section;
      if (!currentSection.attributes) currentSection.attributes = [];
      currentSection.attributes.push(attr);
    } else if (currentPage) {
      if (!currentPage.attributes) currentPage.attributes = [];
      currentPage.attributes.push(attr);
    } else {
      pendingAttrs.push(attr);
    }
  }

  return pages;
}

/**
 * Parse multiple files, merge pages with the same [spekta:page], and collect results.
 */
export function parseFiles(filePaths: string[]): { pages: Page[]; fileToPages: Map<string, Page[]> } {
  const allPages: Page[] = [];
  const fileToPages = new Map<string, Page[]>();

  for (const filePath of filePaths) {
    const pages = parseFile(filePath);
    allPages.push(...pages);
    fileToPages.set(filePath, pages);
  }

  const mergedPages = mergePages(allPages);

  return { pages: mergedPages, fileToPages };
}

/**
 * Merge pages with the same ID (same [spekta:page] title).
 * Sections with the same ID (same path) are also merged recursively.
 */
function mergePages(pages: Page[]): Page[] {
  const pageMap = new Map<string, Page>();

  for (const page of pages) {
    const existingPage = pageMap.get(page.id);
    if (!existingPage) {
      pageMap.set(page.id, { ...page, sections: page.sections ? [...page.sections] : undefined });
      continue;
    }
    // Merge attributes (keep existing, add new)
    if (page.attributes) {
      if (!existingPage.attributes) existingPage.attributes = [];
      existingPage.attributes.push(...page.attributes);
    }
    // Merge sections
    if (page.sections) {
      if (!existingPage.sections) existingPage.sections = [];
      for (const newSection of page.sections) {
        mergeSectionInto(existingPage.sections, newSection);
      }
    }
  }

  return Array.from(pageMap.values());
}

function mergeSectionInto(existingSections: Section[], newSection: Section): void {
  const existingSection = existingSections.find(section => section.id === newSection.id);
  if (!existingSection) {
    existingSections.push(newSection);
    return;
  }
  // Merge attributes
  if (newSection.attributes) {
    if (!existingSection.attributes) existingSection.attributes = [];
    existingSection.attributes.push(...newSection.attributes);
  }
  // Merge steps
  if (newSection.steps) {
    if (!existingSection.steps) existingSection.steps = [];
    existingSection.steps.push(...newSection.steps);
  }
  // Merge nested sections recursively
  if (newSection.sections) {
    if (!existingSection.sections) existingSection.sections = [];
    for (const childSection of newSection.sections) {
      mergeSectionInto(existingSection.sections, childSection);
    }
  }
}
