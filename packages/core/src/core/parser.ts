import * as fs from "node:fs";
import * as crypto from "node:crypto";
import type { Page, Node, SectionNode, StepNode, ImageNode, GraphNode, ItemNode } from "../schema/ir.js";

const SPEKTA_PATTERN = /^(\s*)(?:\/\/|#)\s*\[spekta:([\w:]+)\]\s*(.*)/;

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

    // graph と code は複数行対応: 次の [spekta:*] タグまでコメント行を読み取る
    // code は [spekta:code:end] まで読み取るが、extractComments では1行目のテキスト（言語名）のみ取得
    // code ブロックの本文は buildPages 側で処理する
    if (type === "graph") {
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextMatch = nextLine.match(/^\s*(?:\/\/|#)\s*(.*)/);
        if (!nextMatch) break;
        if (nextMatch[1].match(/\[spekta:[\w:]+\]/)) break;
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

    // code ブロック: [spekta:code] と [spekta:code:end] の間のコメント行を本文として収集
    if (type === "code") {
      const codeLines: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextSpektaMatch = nextLine.match(SPEKTA_PATTERN);
        if (nextSpektaMatch && nextSpektaMatch[2] === "code:end") break;
        const commentMatch = nextLine.match(/^\s*(?:\/\/|#)\s?(.*)/);
        if (commentMatch) {
          codeLines.push(commentMatch[1]);
        } else {
          break;
        }
        j++;
      }
      // code エントリの text を "language\ncode body" に更新（言語名が空でも必ず \n を入れる）
      const language = textLines.join("").trim();
      const codeBody = codeLines.join("\n");
      entries[entries.length - 1].text = `${language}\n${codeBody}`;
    }
  }

  return entries;
}

function buildPages(entries: CommentEntry[]): Page[] {
  const pages: Page[] = [];
  let currentPage: Page | null = null;
  let currentPageTitle = "";
  const sectionStack: { sectionNode: SectionNode; indent: number; title: string }[] = [];
  let pendingNodes: Node[] = [];
  let stepsChildren: Array<StepNode | ImageNode | GraphNode> | null = null;
  let listChildren: ItemNode[] | null = null;

  function getCurrentPath(): string {
    return [currentPageTitle, ...sectionStack.map(s => s.title)].join("/");
  }

  function attachNode(node: Node): void {
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

  for (const entry of entries) {
    // [spekta:steps] — start steps mode
    if (entry.type === "steps") {
      stepsChildren = [];
      continue;
    }

    // [spekta:steps:end] — end steps mode, emit steps node
    if (entry.type === "steps:end") {
      if (stepsChildren) {
        const parentPath = getCurrentPath();
        const stepsNode: Node = {
          type: "steps",
          id: generateId(`${parentPath}/steps`),
          children: stepsChildren,
        };
        attachNode(stepsNode);
        stepsChildren = null;
      }
      continue;
    }

    // Inside steps mode: only step, image, graph allowed
    if (stepsChildren !== null) {
      const parentPath = getCurrentPath();
      if (entry.type === "step") {
        stepsChildren.push({
          type: "step",
          id: generateId(`${parentPath}/step/${stepsChildren.length}/${entry.text}`),
          text: entry.text,
        });
      } else if (entry.type === "image") {
        stepsChildren.push({
          type: "image",
          id: generateId(`${parentPath}/image/${entry.text}`),
          path: entry.text,
        });
      } else if (entry.type === "graph") {
        stepsChildren.push({
          type: "graph",
          id: generateId(`${parentPath}/graph/${entry.text}`),
          text: entry.text,
        });
      }
      continue;
    }

    // [spekta:list] — start list mode
    if (entry.type === "list") {
      listChildren = [];
      continue;
    }

    // [spekta:list:end] — end list mode, emit list node
    if (entry.type === "list:end") {
      if (listChildren) {
        const parentPath = getCurrentPath();
        const listNode: Node = {
          type: "list",
          id: generateId(`${parentPath}/list`),
          children: listChildren,
        };
        attachNode(listNode);
        listChildren = null;
      }
      continue;
    }

    // Inside list mode: only item allowed
    if (listChildren !== null) {
      if (entry.type === "item") {
        const parentPath = getCurrentPath();
        listChildren.push({
          type: "item",
          id: generateId(`${parentPath}/item/${listChildren.length}/${entry.text}`),
          text: entry.text,
        });
      }
      continue;
    }

    // [spekta:code:end] — skip (handled by extractComments)
    if (entry.type === "code:end") {
      continue;
    }

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

      attachNode(sectionNode);
      sectionStack.push({ sectionNode, indent: entry.indent, title: entry.text });
      continue;
    }

    // Other nodes (summary, why, see, image, graph, text, code, callout)
    const parentPath = getCurrentPath();
    const node = entryToNode(entry, parentPath);
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

    attachNode(node);
  }

  return pages;
}

function entryToNode(entry: CommentEntry, parentPath: string): Node | null {
  switch (entry.type) {
    case "summary": return { type: "summary", id: generateId(`${parentPath}/summary/${entry.text}`), text: entry.text };
    case "why": return { type: "why", id: generateId(`${parentPath}/why/${entry.text}`), text: entry.text };
    case "see": return { type: "see", id: generateId(`${parentPath}/see/${entry.text}`), ref: generateId(entry.text) };
    case "image": return { type: "image", id: generateId(`${parentPath}/image/${entry.text}`), path: entry.text };
    case "graph": return { type: "graph", id: generateId(`${parentPath}/graph/${entry.text}`), text: entry.text };
    case "text": return { type: "text", id: generateId(`${parentPath}/text/${entry.text}`), text: entry.text };
    case "code": {
      const newlineIndex = entry.text.indexOf("\n");
      const language = newlineIndex >= 0 ? entry.text.slice(0, newlineIndex).trim() : "";
      const codeBody = newlineIndex >= 0 ? entry.text.slice(newlineIndex + 1) : entry.text;
      return { type: "code", id: generateId(`${parentPath}/code/${entry.text}`), language, text: codeBody };
    }
    case "callout": {
      const spaceIndex = entry.text.indexOf(" ");
      const variant = spaceIndex >= 0 ? entry.text.slice(0, spaceIndex) : entry.text;
      const calloutText = spaceIndex >= 0 ? entry.text.slice(spaceIndex + 1) : "";
      if (variant !== "note" && variant !== "warning" && variant !== "tip") return null;
      return { type: "callout", id: generateId(`${parentPath}/callout/${entry.text}`), variant, text: calloutText };
    }
    default: return null;
  }
}

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

  if (newNode.children) {
    if (!existingSection.children) existingSection.children = [];
    for (const childNode of newNode.children) {
      mergeNodeInto(existingSection.children, childNode);
    }
  }
}
