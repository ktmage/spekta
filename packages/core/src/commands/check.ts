import * as fs from "node:fs";
import * as path from "node:path";
import type { SpektaConfig } from "../schema/types.js";
import { collectFiles, collectAllFiles } from "../core/files.js";

const SPEKTA_PATTERN = /^(\s*)(?:\/\/|#)\s*\[spekta:([\w:]+)\]\s*(.*)/;

interface CheckResult {
  filePath: string;
  pageCount: number;
  sectionCount: number;
  errors: string[];
}

export function check(config: SpektaConfig): void {
  const targetDir = path.resolve(config.target_dir);
  const filePaths = config.include
    ? collectFiles(targetDir, config.include)
    : collectAllFiles(targetDir);
  const filteredPaths = config.exclude
    ? filePaths.filter(f => !config.exclude!.some(pattern => f.includes(pattern)))
    : filePaths;

  if (filteredPaths.length === 0) {
    console.warn("No test files found.");
    process.exit(1);
  }

  let passedCount = 0;
  let failedCount = 0;

  for (const filePath of filteredPaths) {
    const checkResult = checkFile(filePath);
    const relativePath = path.relative(process.cwd(), filePath);

    if (checkResult.errors.length === 0) {
      if (checkResult.pageCount > 0) {
        console.log(`  ✓ ${relativePath} (${checkResult.pageCount} page, ${checkResult.sectionCount} section)`);
        passedCount++;
      }
    } else {
      console.log(`  ✗ ${relativePath}`);
      for (const error of checkResult.errors) {
        console.log(`    - ${error}`);
      }
      failedCount++;
    }
  }

  console.log("");
  if (failedCount === 0) {
    console.log(`${passedCount} passed.`);
  } else {
    console.log(`${passedCount} passed, ${failedCount} failed.`);
    process.exit(1);
  }
}

const CALLOUT_VARIANTS = ["note", "warning", "tip"];

function checkFile(filePath: string): CheckResult {
  const source = fs.readFileSync(filePath, "utf-8");
  const lines = source.split("\n");
  const errors: string[] = [];
  let pageCount = 0;
  let sectionCount = 0;
  let stepsOpen = false;
  let stepsOpenLine = 0;
  let codeOpen = false;
  let codeOpenLine = 0;
  let listOpen = false;
  let listOpenLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(SPEKTA_PATTERN);
    if (!match) continue;

    const lineNum = i + 1;
    const type = match[2];
    const text = match[3];

    switch (type) {
      case "page":
        pageCount++;
        if (!text.trim()) {
          errors.push(`line ${lineNum}: [spekta:page] にページ名がありません`);
        }
        break;

      case "section":
        sectionCount++;
        if (!text.trim()) {
          errors.push(`line ${lineNum}: [spekta:section] にセクション名がありません`);
        }
        break;

      case "steps":
        if (stepsOpen) {
          errors.push(`line ${lineNum}: [spekta:steps] がネストしています（line ${stepsOpenLine} が閉じられていません）`);
        }
        stepsOpen = true;
        stepsOpenLine = lineNum;
        break;

      case "steps:end":
        if (!stepsOpen) {
          errors.push(`line ${lineNum}: 対応する [spekta:steps] がない [spekta:steps:end] です`);
        }
        stepsOpen = false;
        break;

      case "step":
        if (!stepsOpen) {
          errors.push(`line ${lineNum}: [spekta:step] が [spekta:steps] ブロックの外にあります`);
        }
        if (!text.trim()) {
          errors.push(`line ${lineNum}: [spekta:step] にテキストがありません`);
        }
        break;

      case "code":
        if (codeOpen) {
          errors.push(`line ${lineNum}: [spekta:code] がネストしています（line ${codeOpenLine} が閉じられていません）`);
        }
        codeOpen = true;
        codeOpenLine = lineNum;
        break;

      case "code:end":
        if (!codeOpen) {
          errors.push(`line ${lineNum}: 対応する [spekta:code] がない [spekta:code:end] です`);
        }
        codeOpen = false;
        break;

      case "list":
        if (listOpen) {
          errors.push(`line ${lineNum}: [spekta:list] がネストしています（line ${listOpenLine} が閉じられていません）`);
        }
        listOpen = true;
        listOpenLine = lineNum;
        break;

      case "list:end":
        if (!listOpen) {
          errors.push(`line ${lineNum}: 対応する [spekta:list] がない [spekta:list:end] です`);
        }
        listOpen = false;
        break;

      case "item":
        if (!listOpen) {
          errors.push(`line ${lineNum}: [spekta:item] が [spekta:list] ブロックの外にあります`);
        }
        if (!text.trim()) {
          errors.push(`line ${lineNum}: [spekta:item] にテキストがありません`);
        }
        break;

      case "text":
        if (!text.trim()) {
          errors.push(`line ${lineNum}: [spekta:text] にテキストがありません`);
        }
        break;

      case "callout": {
        const spaceIndex = text.indexOf(" ");
        const variant = spaceIndex >= 0 ? text.slice(0, spaceIndex) : text.trim();
        const calloutText = spaceIndex >= 0 ? text.slice(spaceIndex + 1) : "";
        if (!CALLOUT_VARIANTS.includes(variant)) {
          errors.push(`line ${lineNum}: [spekta:callout] の variant が不正です（${variant}）。note, warning, tip のいずれかを指定してください`);
        }
        if (!calloutText.trim()) {
          errors.push(`line ${lineNum}: [spekta:callout] にテキストがありません`);
        }
        break;
      }

      case "summary":
      case "why":
        if (!text.trim()) {
          errors.push(`line ${lineNum}: [spekta:${type}] にテキストがありません`);
        }
        break;

      case "graph":
        break;

      case "see":
        if (!text.trim()) {
          errors.push(`line ${lineNum}: [spekta:see] に参照先がありません`);
        }
        break;

      case "image":
        if (!text.trim()) {
          errors.push(`line ${lineNum}: [spekta:image] にパスがありません`);
        }
        break;
    }
  }

  if (stepsOpen) {
    errors.push(`line ${stepsOpenLine}: [spekta:steps] に対応する [spekta:steps:end] がありません`);
  }

  if (codeOpen) {
    errors.push(`line ${codeOpenLine}: [spekta:code] に対応する [spekta:code:end] がありません`);
  }

  if (listOpen) {
    errors.push(`line ${listOpenLine}: [spekta:list] に対応する [spekta:list:end] がありません`);
  }

  if (pageCount === 0 && sectionCount > 0) {
    errors.push("[spekta:page] がありません");
  }

  return { filePath, pageCount, sectionCount, errors };
}
