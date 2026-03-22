import * as fs from "node:fs";
import * as path from "node:path";
import type { IR, Page, Section, Attribute, Step } from "@ktmage/spekta";

function stepToPhrase(step: Step): string {
  switch (step.action) {
    case "visit": return "ページを開く";
    case "click_on": return `「${step.target}」をクリック`;
    case "fill_in":
      return step.value !== undefined && step.value !== ""
        ? `「${step.target}」に「${step.value}」と入力`
        : `「${step.target}」を空にする`;
    case "select": return `「${step.target}」から「${step.value}」を選択`;
    case "expect":
      if (step.target.startsWith("not: ")) return `「${step.target.slice(5)}」が表示されない`;
      return `「${step.target}」が表示される`;
    default: return step.target;
  }
}

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

function renderPage(
  page: Page,
  pageById: Map<string, Page>,
  imagePaths: string[],
): string {
  const lines: string[] = [];
  const displayTitle = page.sections?.[0]?.title ?? page.title;

  lines.push(`# ${displayTitle}`);
  lines.push("");

  if (page.attributes) {
    renderAttributes(lines, page.attributes, pageById, imagePaths);
  }

  if (page.sections) {
    for (const section of page.sections) {
      renderSection(lines, section, 2, pageById, imagePaths);
    }
  }

  return lines.join("\n");
}

function renderSection(
  lines: string[],
  section: Section,
  depth: number,
  pageById: Map<string, Page>,
  imagePaths: string[],
): void {
  const headingLevel = Math.min(depth, 4);
  const headingPrefix = "#".repeat(headingLevel);

  lines.push(`${headingPrefix} ${section.title}`);
  lines.push("");

  if (section.attributes) {
    renderAttributes(lines, section.attributes, pageById, imagePaths);
  }

  if (section.steps && section.steps.length > 0) {
    renderSteps(lines, section.steps);
  }

  if (section.sections) {
    for (const childSection of section.sections) {
      renderSection(lines, childSection, depth + 1, pageById, imagePaths);
    }
  }
}

function renderAttributes(
  lines: string[],
  attributes: Attribute[],
  pageById: Map<string, Page>,
  imagePaths: string[],
): void {
  for (const attr of attributes) {
    switch (attr.type) {
      case "summary":
        if (attr.text) {
          lines.push(attr.text);
          lines.push("");
        }
        break;
      case "why":
        if (attr.text) {
          lines.push(`> **なぜ**: ${attr.text}`);
          lines.push("");
        }
        break;
      case "see":
        if (attr.ref) {
          const refPage = pageById.get(attr.ref);
          if (refPage) {
            lines.push(`関連: [${refPage.title}](${refPage.title}.md)`);
            lines.push("");
          }
        }
        break;
      case "image":
        if (attr.text) {
          imagePaths.push(attr.text);
          const filename = path.basename(attr.text);
          lines.push(`![${filename}](images/${filename})`);
          lines.push("");
        }
        break;
      case "graph":
        if (attr.text) {
          lines.push("```mermaid");
          lines.push(attr.text);
          lines.push("```");
          lines.push("");
        }
        break;
    }
  }
}

function renderSteps(lines: string[], steps: Step[]): void {
  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const phrase = stepToPhrase(steps[stepIndex]);
    lines.push(`${stepIndex + 1}. ${phrase}`);
  }
  lines.push("");
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
