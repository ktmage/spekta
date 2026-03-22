import * as fs from "node:fs";
import * as path from "node:path";
import type { IR, Page, Node, SectionNode } from "@ktmage/spekta";

export function renderMarkdown(ir: IR, outputPath: string): void {
  fs.mkdirSync(outputPath, { recursive: true });

  const pageById = new Map<string, Page>();
  for (const page of ir.pages) {
    pageById.set(page.id, page);
  }

  const imagePaths: string[] = [];

  for (const page of ir.pages) {
    const markdownContent = renderPage(page, pageById, imagePaths);
    const markdownFilePath = path.join(outputPath, `${page.title}.md`);
    fs.writeFileSync(markdownFilePath, markdownContent, "utf-8");
  }

  if (imagePaths.length > 0) {
    const imagesDir = path.join(outputPath, "images");
    fs.mkdirSync(imagesDir, { recursive: true });
    for (const imagePath of imagePaths) {
      const sourcePath = path.resolve(imagePath);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, path.join(imagesDir, path.basename(imagePath)));
      }
    }
  }
}

function renderPage(page: Page, pageById: Map<string, Page>, imagePaths: string[]): string {
  const lines: string[] = [];
  const firstSection = page.children?.find((node): node is SectionNode => node.type === "section");
  const displayTitle = firstSection?.title ?? page.title;

  lines.push(`# ${displayTitle}`);
  lines.push("");

  if (page.children) {
    renderNodes(lines, page.children, 2, pageById, imagePaths);
  }

  return lines.join("\n");
}

function renderNodes(
  lines: string[],
  nodes: Node[],
  headingDepth: number,
  pageById: Map<string, Page>,
  imagePaths: string[],
): void {
  for (const node of nodes) {
    switch (node.type) {
      case "summary":
        lines.push(node.text);
        lines.push("");
        break;
      case "why":
        lines.push(`> **なぜ**: ${node.text}`);
        lines.push("");
        break;
      case "see": {
        const refPage = pageById.get(node.ref);
        if (refPage) {
          lines.push(`関連: [${refPage.title}](${refPage.title}.md)`);
          lines.push("");
        }
        break;
      }
      case "image":
        imagePaths.push(node.path);
        lines.push(`![${path.basename(node.path)}](images/${path.basename(node.path)})`);
        lines.push("");
        break;
      case "graph":
        lines.push("```mermaid");
        lines.push(node.text);
        lines.push("```");
        lines.push("");
        break;
      case "steps":
        for (let stepIndex = 0; stepIndex < node.items.length; stepIndex++) {
          lines.push(`${stepIndex + 1}. ${node.items[stepIndex]}`);
        }
        lines.push("");
        break;
      case "section":
        renderSectionNode(lines, node, headingDepth, pageById, imagePaths);
        break;
    }
  }
}

function renderSectionNode(
  lines: string[],
  sectionNode: SectionNode,
  depth: number,
  pageById: Map<string, Page>,
  imagePaths: string[],
): void {
  const headingLevel = Math.min(depth, 4);
  const headingPrefix = "#".repeat(headingLevel);

  lines.push(`${headingPrefix} ${sectionNode.title}`);
  lines.push("");

  if (sectionNode.children) {
    // Render non-section nodes first, then child sections
    const nonSectionNodes = sectionNode.children.filter(
      (node) => node.type !== "section"
    );
    renderNodes(lines, nonSectionNodes, depth + 1, pageById, imagePaths);

    const childSections = sectionNode.children.filter(
      (node): node is SectionNode => node.type === "section"
    );
    for (const childSection of childSections) {
      renderSectionNode(lines, childSection, depth + 1, pageById, imagePaths);
    }
  }
}

// ExporterPlugin interface
const plugin = {
  name: "markdown",
  defaultOutputDir: "markdown",
  export(ir: IR, _config: Record<string, unknown>, outputDir: string): void {
    renderMarkdown(ir, outputDir);
  },
};

export default plugin;
