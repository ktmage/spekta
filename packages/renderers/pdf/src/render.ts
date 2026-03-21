import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";

interface BehaviorIR { version: string; pages: Page[]; }
interface Page { id: string; type: string; title: string; attributes?: Attribute[]; sections?: Section[]; }
interface Section { id: string; title: string; attributes?: Attribute[]; sections?: Section[]; steps?: Step[]; }
interface Attribute { type: string; text?: string; ref?: string; }
interface Step { action: string; target: string; value?: string; }

export type { BehaviorIR };

/**
 * Convert a step to a natural Japanese phrase.
 */
function stepToPhrase(step: Step): string {
  switch (step.action) {
    case "visit":
      return "ページを開く";
    case "click_on":
      return `「${step.target}」をクリック`;
    case "fill_in":
      return step.value !== undefined && step.value !== ""
        ? `「${step.target}」に「${step.value}」と入力`
        : `「${step.target}」を空にする`;
    case "select":
      return `「${step.target}」から「${step.value}」を選択`;
    case "expect":
      if (step.target.startsWith("not: ")) {
        return `「${step.target.slice(5)}」が表示されない`;
      }
      return `「${step.target}」が表示される`;
    default:
      return step.target;
  }
}

/**
 * Render BehaviorIR to a single PDF file via pandoc.
 *
 * Generates a combined Markdown document (all pages with page breaks),
 * writes it to a temp file, and calls pandoc to convert it to PDF.
 */
export function renderPdf(ir: BehaviorIR, outputPath: string): void {
  fs.mkdirSync(outputPath, { recursive: true });

  // Build a page ID → page mapping for resolving see refs
  const pageById = new Map<string, Page>();
  for (const page of ir.pages) {
    pageById.set(page.id, page);
  }

  // Generate combined Markdown
  const mdParts: string[] = [];

  for (let i = 0; i < ir.pages.length; i++) {
    if (i > 0) {
      // Page break for pandoc (LaTeX)
      mdParts.push("\\newpage");
      mdParts.push("");
    }
    mdParts.push(renderPage(ir.pages[i], pageById));
  }

  const combinedMd = mdParts.join("\n");

  // Write temp markdown file
  const tmpMdPath = path.join(outputPath, "_spekta_temp.md");
  const pdfPath = path.join(outputPath, "specification.pdf");

  fs.writeFileSync(tmpMdPath, combinedMd, "utf-8");

  // Check if pandoc is available
  try {
    execFileSync("which", ["pandoc"], { encoding: "utf-8" });
  } catch {
    console.error("Error: pandoc is not installed or not found in PATH.");
    console.error("Please install pandoc to generate PDF output.");
    console.error("  macOS:   brew install pandoc");
    console.error("  Ubuntu:  sudo apt-get install pandoc");
    console.error("  Windows: choco install pandoc");
    console.error("");
    console.error("You also need a LaTeX engine (e.g., lualatex) for PDF output.");
    cleanup(tmpMdPath);
    return;
  }

  // Run pandoc
  try {
    execFileSync("pandoc", [
      tmpMdPath,
      "-o", pdfPath,
      "--pdf-engine=lualatex",
      "-V", "documentclass=ltjsarticle",
      "-V", "geometry:margin=2.5cm",
      "--toc",
      "--toc-depth=3",
    ], {
      encoding: "utf-8",
      stdio: ["pipe", "inherit", "inherit"],
      maxBuffer: 50 * 1024 * 1024,
    });

    console.log(`PDF generated: ${pdfPath}`);
  } catch (err) {
    console.error("Failed to generate PDF with pandoc:", err);
    console.error("Make sure pandoc and a LaTeX engine (lualatex) are installed.");
  } finally {
    cleanup(tmpMdPath);
  }
}

/**
 * Clean up temp file.
 */
function cleanup(tmpPath: string): void {
  try {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Render a single page to Markdown text.
 */
function renderPage(page: Page, pageById: Map<string, Page>): string {
  const lines: string[] = [];

  lines.push(`# ${page.title}`);
  lines.push("");

  if (page.attributes) {
    renderAttributes(lines, page.attributes, pageById);
  }

  if (page.sections) {
    for (const section of page.sections) {
      renderSection(lines, section, 2, pageById);
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
): void {
  const headingLevel = Math.min(depth, 4);
  const prefix = "#".repeat(headingLevel);

  lines.push(`${prefix} ${section.title}`);
  lines.push("");

  if (section.attributes) {
    renderAttributes(lines, section.attributes, pageById);
  }

  if (section.steps && section.steps.length > 0) {
    for (let i = 0; i < section.steps.length; i++) {
      const phrase = stepToPhrase(section.steps[i]);
      lines.push(`${i + 1}. ${phrase}`);
    }
    lines.push("");
  }

  if (section.sections) {
    for (const child of section.sections) {
      renderSection(lines, child, depth + 1, pageById);
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
            lines.push(`関連: ${refPage.title}`);
            lines.push("");
          }
        }
        break;

      case "image":
        if (attr.text) {
          const filename = path.basename(attr.text);
          // For PDF, images referenced via relative path from the source
          lines.push(`![${filename}](${attr.text})`);
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
