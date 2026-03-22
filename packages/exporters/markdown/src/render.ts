import * as fs from "node:fs";
import * as path from "node:path";

// IR types (self-contained)
interface BehaviorIR { version: string; pages: Page[]; }
interface Page { id: string; type: string; title: string; attributes?: Attribute[]; sections?: Section[]; }
interface Section { id: string; title: string; attributes?: Attribute[]; sections?: Section[]; steps?: Step[]; }
interface Attribute { type: string; text?: string; ref?: string; }
interface Step { action: string; target: string; value?: string; }

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

export type { BehaviorIR };

/**
 * Render BehaviorIR to Markdown files.
 *
 * For each page, generates a .md file named after the page ID.
 * Copies referenced images to the output/images/ directory.
 */
export function renderMarkdown(ir: BehaviorIR, outputPath: string): void {
  fs.mkdirSync(outputPath, { recursive: true });

  // Build a page ID → page mapping for resolving see refs
  const pageById = new Map<string, Page>();
  for (const page of ir.pages) {
    pageById.set(page.id, page);
  }

  // Collect all image paths for copying
  const imagePaths: string[] = [];

  for (const page of ir.pages) {
    const md = renderPage(page, pageById, imagePaths);
    const filePath = path.join(outputPath, `${page.id}.md`);
    fs.writeFileSync(filePath, md, "utf-8");
  }

  // Copy images
  if (imagePaths.length > 0) {
    const imagesDir = path.join(outputPath, "images");
    fs.mkdirSync(imagesDir, { recursive: true });

    for (const imgPath of imagePaths) {
      const srcPath = path.resolve(imgPath);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(imagesDir, path.basename(imgPath));
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Render a single page to Markdown text.
 */
function renderPage(
  page: Page,
  pageById: Map<string, Page>,
  imagePaths: string[],
): string {
  const lines: string[] = [];

  // Page title
  lines.push(`# ${page.title}`);
  lines.push("");

  // Page attributes
  if (page.attributes) {
    renderAttributes(lines, page.attributes, pageById, imagePaths);
  }

  // Sections
  if (page.sections) {
    for (const section of page.sections) {
      renderSection(lines, section, 2, pageById, imagePaths);
    }
  }

  return lines.join("\n");
}

/**
 * Render a section at the given heading depth.
 */
function renderSection(
  lines: string[],
  section: Section,
  depth: number,
  pageById: Map<string, Page>,
  imagePaths: string[],
): void {
  // Cap depth at 4 (####)
  const headingLevel = Math.min(depth, 4);
  const prefix = "#".repeat(headingLevel);

  lines.push(`${prefix} ${section.title}`);
  lines.push("");

  // Section attributes
  if (section.attributes) {
    renderAttributes(lines, section.attributes, pageById, imagePaths);
  }

  // Steps
  if (section.steps && section.steps.length > 0) {
    renderSteps(lines, section.steps);
  }

  // Nested sections
  if (section.sections) {
    for (const child of section.sections) {
      renderSection(lines, child, depth + 1, pageById, imagePaths);
    }
  }
}

/**
 * Render attributes to Markdown lines.
 */
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
            lines.push(`関連: [${refPage.title}](${refPage.id}.md)`);
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

/**
 * Render steps as a numbered list.
 */
function renderSteps(lines: string[], steps: Step[]): void {
  for (let i = 0; i < steps.length; i++) {
    const phrase = stepToPhrase(steps[i]);
    lines.push(`${i + 1}. ${phrase}`);
  }
  lines.push("");
}

// ExporterPlugin interface
const plugin = {
  name: "markdown",
  defaultOutputDir: "markdown",
  export(ir: BehaviorIR, _config: Record<string, unknown>, outputDir: string): void {
    renderMarkdown(ir, outputDir);
  },
};

export default plugin;
