import * as fs from "node:fs";
import * as crypto from "node:crypto";
import type { Page, Node, SectionNode } from "../schema/ir.js";

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
  const sectionStack: { sectionNode: SectionNode; indent: number; title: string }[] = [];
  let pendingNodes: Node[] = [];

  for (const entry of entries) {
    if (entry.type === "page") {
      currentPageTitle = entry.text;
      currentPage = {
        id: generateId(currentPageTitle),
        type: "feature",
        title: currentPageTitle,
      };
      if (pendingNodes.length > 0) {
        currentPage.children = pendingNodes;
        pendingNodes = [];
      }
      pages.push(currentPage);
      sectionStack.length = 0;
      continue;
    }

    if (entry.type === "section") {
      while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].indent >= entry.indent) {
        sectionStack.pop();
      }

      const sectionPath = [
        currentPageTitle,
        ...sectionStack.map(stackEntry => stackEntry.title),
        entry.text,
      ].join("/");

      const sectionNode: SectionNode = {
        type: "section",
        id: generateId(sectionPath),
        title: entry.text,
      };

      if (sectionStack.length > 0) {
        const parentSection = sectionStack[sectionStack.length - 1].sectionNode;
        if (!parentSection.children) parentSection.children = [];
        parentSection.children.push(sectionNode);
      } else if (currentPage) {
        if (!currentPage.children) currentPage.children = [];
        currentPage.children.push(sectionNode);
      }

      sectionStack.push({ sectionNode, indent: entry.indent, title: entry.text });
      continue;
    }

    // Convert entry to Node
    const node = entryToNode(entry);
    if (!node) continue;

    // Look ahead: if a [spekta:page] follows, this node belongs to the next page
    let hasUpcomingPage = false;
    for (let j = entries.indexOf(entry) + 1; j < entries.length; j++) {
      if (entries[j].type === "page") { hasUpcomingPage = true; break; }
      if (entries[j].type === "section" || entries[j].type === "step") break;
    }
    if (hasUpcomingPage) {
      pendingNodes.push(node);
      continue;
    }

    // Attach to most recent section, or page
    if (sectionStack.length > 0) {
      const currentSection = sectionStack[sectionStack.length - 1].sectionNode;
      if (!currentSection.children) currentSection.children = [];
      currentSection.children.push(node);
    } else if (currentPage) {
      if (!currentPage.children) currentPage.children = [];
      currentPage.children.push(node);
    } else {
      pendingNodes.push(node);
    }
  }

  return pages;
}

function entryToNode(entry: CommentEntry): Node | null {
  switch (entry.type) {
    case "summary": return { type: "summary", text: entry.text };
    case "why": return { type: "why", text: entry.text };
    case "see": return { type: "see", ref: entry.text };
    case "step": return { type: "step", text: entry.text };
    case "image": return { type: "image", path: entry.text };
    case "graph": return { type: "graph", text: entry.text };
    default: return null;
  }
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

function mergePages(pages: Page[]): Page[] {
  const pageMap = new Map<string, Page>();

  for (const page of pages) {
    const existingPage = pageMap.get(page.id);
    if (!existingPage) {
      pageMap.set(page.id, { ...page, children: page.children ? [...page.children] : undefined });
      continue;
    }
    if (page.children) {
      if (!existingPage.children) existingPage.children = [];
      for (const newChild of page.children) {
        mergeNodeInto(existingPage.children, newChild);
      }
    }
  }

  return Array.from(pageMap.values());
}

function mergeNodeInto(existingChildren: Node[], newNode: Node): void {
  if (newNode.type !== "section") {
    existingChildren.push(newNode);
    return;
  }

  const existingSection = existingChildren.find(
    (child): child is SectionNode => child.type === "section" && child.id === newNode.id
  );

  if (!existingSection) {
    existingChildren.push(newNode);
    return;
  }

  // Merge children of matching sections
  if (newNode.children) {
    if (!existingSection.children) existingSection.children = [];
    for (const childNode of newNode.children) {
      mergeNodeInto(existingSection.children, childNode);
    }
  }
}
