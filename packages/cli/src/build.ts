import * as fs from "node:fs";
import * as path from "node:path";
import type { SpektaConfig, BehaviorIR, SiteInfo, Page, Section, Attribute } from "./types.js";
import { analyzeAll } from "./analyzer.js";
import { resolveRefs, buildTitleToIdMap } from "./resolve-refs.js";
// Renderers are loaded dynamically from packages/renderers/

export interface BuildOptions {
  mode: "production" | "development";
}

export async function build(config: SpektaConfig, options: BuildOptions): Promise<void> {
  const specDir = path.resolve(config.spec_dir);

  console.log(`Analyzing spec files in: ${specDir}`);

  const { pages, fileToPages } = analyzeAll(specDir, config.analyzer.rspec.spec_types);

  if (pages.length === 0) {
    console.warn("No pages found. Check your spec files and configuration.");
    return;
  }

  console.log(`Found ${pages.length} page(s).`);

  const titleToId = buildTitleToIdMap(pages);
  resolveRefs(pages, fileToPages, titleToId);

  const ir: BehaviorIR = { version: "1.0.0", pages };
  const imagePaths = collectImagePaths(pages);

  // Web renderer
  if (config.renderer.web) {
    const webPath = path.resolve(config.renderer.web.path ?? ".spekta/web");
    outputIR(ir, webPath, imagePaths);
    outputSiteInfo(webPath, {
      name: config.renderer.web.name,
      description: config.renderer.web.description,
      builtAt: new Date().toISOString(),
      mode: options.mode,
    });
    console.log(`Web renderer output: ${webPath}/data/`);

    // Copy to renderer-web public/data/ for Astro dev server
    const rendererWebData = path.resolve(
      import.meta.dirname ?? ".",
      "../../renderers/web/public/data",
    );
    if (fs.existsSync(path.dirname(rendererWebData))) {
      outputIR(ir, path.join(rendererWebData, ".."), imagePaths);
      outputSiteInfo(path.join(rendererWebData, ".."), {
        name: config.renderer.web.name,
        description: config.renderer.web.description,
        builtAt: new Date().toISOString(),
        mode: options.mode,
      });
    }
  }

  // Markdown renderer
  if (config.renderer.markdown) {
    const mdPath = path.resolve(config.renderer.markdown.path ?? ".spekta/markdown");
    const rendererDir = path.resolve(import.meta.dirname ?? ".", "../../renderers/markdown/dist/render.js");
    try {
      const { renderMarkdown } = await import(rendererDir);
      renderMarkdown(ir, mdPath);
      console.log(`Markdown renderer output: ${mdPath}/`);
    } catch {
      console.error(`Markdown renderer not built. Run: cd packages/renderers/markdown && npm run build`);
    }
  }

  // PDF renderer
  if (config.renderer.pdf) {
    const pdfPath = path.resolve(config.renderer.pdf.path ?? ".spekta/pdf");
    const rendererDir = path.resolve(import.meta.dirname ?? ".", "../../renderers/pdf/dist/render.js");
    try {
      const { renderPdf } = await import(rendererDir);
      renderPdf(ir, pdfPath);
      console.log(`PDF renderer output: ${pdfPath}/`);
    } catch {
      console.error(`PDF renderer not built. Run: cd packages/renderers/pdf && npm run build`);
    }
  }

  console.log("Build complete.");
}

function collectImagePaths(pages: Page[]): string[] {
  const paths: string[] = [];

  function fromAttrs(attrs?: Attribute[]): void {
    if (!attrs) return;
    for (const attr of attrs) {
      if (attr.type === "image" && attr.text) paths.push(attr.text);
    }
  }

  function fromSections(sections?: Section[]): void {
    if (!sections) return;
    for (const s of sections) {
      fromAttrs(s.attributes);
      fromSections(s.sections);
    }
  }

  for (const page of pages) {
    fromAttrs(page.attributes);
    fromSections(page.sections);
  }

  return [...new Set(paths)];
}

function outputIR(ir: BehaviorIR, basePath: string, imagePaths: string[]): void {
  const dataDir = path.join(basePath, "data");
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(path.join(dataDir, "behavior.json"), JSON.stringify(ir, null, 2), "utf-8");

  if (imagePaths.length > 0) {
    const imagesDir = path.join(dataDir, "images");
    fs.mkdirSync(imagesDir, { recursive: true });

    for (const imgPath of imagePaths) {
      const srcPath = path.resolve(imgPath);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(imagesDir, path.basename(imgPath)));
      }
    }
  }
}

function outputSiteInfo(basePath: string, siteInfo: SiteInfo): void {
  const dataDir = path.join(basePath, "data");
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "site.json"), JSON.stringify(siteInfo, null, 2), "utf-8");
}
