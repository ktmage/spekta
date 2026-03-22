import * as ts from "typescript";
import * as fs from "node:fs";
import * as crypto from "node:crypto";
import type { Page, Section, Attribute, Step } from "../schema.js";

const SPEKTA_COMMENT_PATTERN = /\[spekta:(\w+)\]\s*(.*)/;

function generateId(filePath: string, ...parts: string[]): string {
  return crypto.createHash("sha256").update([filePath, ...parts].join("/")).digest("hex").slice(0, 8);
}

export function parseFile(filePath: string): Page[] {
  const source = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);

  const pages: Page[] = [];

  // Collect all comments with their line numbers
  const comments = extractSpektaComments(source);

  // Detect describe aliases (e.g. `const context = describe`)
  const describeAliases = collectDescribeAliases(sourceFile);

  ts.forEachChild(sourceFile, (node) => {
    let call: ts.CallExpression | null = null;
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      call = node.expression;
    } else if (ts.isCallExpression(node)) {
      call = node;
    }
    if (call && isDescribeCall(call, describeAliases)) {
      const page = buildPage(call, filePath, comments, [], describeAliases);
      if (page) pages.push(page);
    }
  });

  return pages;
}

function collectDescribeAliases(sourceFile: ts.SourceFile): Set<string> {
  const aliases = new Set<string>(["describe"]);
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isVariableStatement(node)) return;
    for (const decl of node.declarationList.declarations) {
      if (
        ts.isIdentifier(decl.name) &&
        decl.initializer &&
        ts.isIdentifier(decl.initializer) &&
        decl.initializer.text === "describe"
      ) {
        aliases.add(decl.name.text);
      }
    }
  });
  return aliases;
}

function buildPage(node: ts.CallExpression, filePath: string, comments: CommentEntry[], path: string[], describeAliases: Set<string>): Page | null {
  const title = extractFirstStringArg(node);
  if (!title) return null;

  const currentPath = [...path, title];
  const attrs = getCommentsBeforeLine(comments, getStartLine(node));
  const sections = extractChildren(node, filePath, comments, currentPath, describeAliases);

  const page: Page = {
    id: generateId(filePath, title),
    type: "feature",
    title,
  };
  if (attrs.length > 0) page.attributes = attrs;
  if (sections.length > 0) page.sections = sections;
  return page;
}

function buildSection(node: ts.CallExpression, filePath: string, comments: CommentEntry[], path: string[], describeAliases: Set<string>): Section | null {
  const title = extractFirstStringArg(node);
  if (!title) return null;

  const currentPath = [...path, title];
  const attrs = getCommentsBeforeLine(comments, getStartLine(node));

  if (isDescribeCall(node, describeAliases)) {
    const children = extractChildren(node, filePath, comments, currentPath, describeAliases);
    const section: Section = { id: generateId(currentPath.join("/")), title };
    if (attrs.length > 0) section.attributes = attrs;
    if (children.length > 0) section.sections = children;
    return section;
  }

  if (isItCall(node)) {
    const section: Section = { id: generateId(currentPath.join("/")), title };
    if (attrs.length > 0) section.attributes = attrs;
    const steps = extractStepComments(node, comments);
    if (steps.length > 0) section.steps = steps;
    return section;
  }

  return null;
}

function extractStepComments(node: ts.CallExpression, comments: CommentEntry[]): Step[] {
  const callback = getCallbackArg(node);
  if (!callback) return [];
  const body = (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) ? callback.body : null;
  if (!body) return [];

  const sf = node.getSourceFile();
  const startLine = sf.getLineAndCharacterOfPosition(body.getStart()).line + 1;
  const endLine = sf.getLineAndCharacterOfPosition(body.getEnd()).line + 1;

  const steps: Step[] = [];
  for (const c of comments) {
    if (c.type === "step" && c.line >= startLine && c.line <= endLine && !c.used) {
      c.used = true;
      steps.push({ action: "other" as Step["action"], target: c.text });
    }
  }
  return steps;
}

function extractChildren(node: ts.CallExpression, filePath: string, comments: CommentEntry[], path: string[], describeAliases: Set<string>): Section[] {
  const sections: Section[] = [];
  const callback = getCallbackArg(node);
  if (!callback) return sections;

  const body = ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)
    ? callback.body
    : null;

  if (!body || !ts.isBlock(body)) return sections;

  for (const stmt of body.statements) {
    if (ts.isExpressionStatement(stmt) && ts.isCallExpression(stmt.expression)) {
      const call = stmt.expression;
      if (isDescribeCall(call, describeAliases) || isItCall(call)) {
        const section = buildSection(call, filePath, comments, path, describeAliases);
        if (section) sections.push(section);
      }
    }
  }

  return sections;
}

function isDescribeCall(node: ts.Node, describeAliases: Set<string>): boolean {
  if (!ts.isCallExpression(node)) return false;
  const expr = node.expression;
  // describe("...") or context("...")
  if (ts.isIdentifier(expr) && describeAliases.has(expr.text)) return true;
  // describe.runIf(...)("...") or context.runIf(...)("...")
  if (ts.isCallExpression(expr) && ts.isPropertyAccessExpression(expr.expression)) {
    const obj = expr.expression.expression;
    if (ts.isIdentifier(obj) && describeAliases.has(obj.text)) return true;
  }
  return false;
}

function isItCall(node: ts.Node): boolean {
  if (!ts.isCallExpression(node)) return false;
  const expr = node.expression;
  if (ts.isIdentifier(expr) && expr.text === "it") return true;
  return false;
}

function extractFirstStringArg(node: ts.CallExpression): string | null {
  for (const arg of node.arguments) {
    if (ts.isStringLiteral(arg)) return arg.text;
  }
  // describe.runIf(...)("title", fn) — need to check if this is a curried call
  if (ts.isCallExpression(node.expression)) {
    for (const arg of node.arguments) {
      if (ts.isStringLiteral(arg)) return arg.text;
    }
  }
  return null;
}

function getCallbackArg(node: ts.CallExpression): ts.ArrowFunction | ts.FunctionExpression | null {
  for (const arg of node.arguments) {
    if (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) return arg;
  }
  return null;
}

function getStartLine(node: ts.Node): number {
  const sf = node.getSourceFile();
  return sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
}

// Comment handling
interface CommentEntry {
  type: string;
  text: string;
  line: number;
  used: boolean;
}

function extractSpektaComments(source: string): CommentEntry[] {
  const entries: CommentEntry[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("//")) continue;

    const commentText = line.replace(/^\/\/\s*/, "");
    const match = commentText.match(SPEKTA_COMMENT_PATTERN);
    if (!match) continue;

    const attrType = match[1];
    const textLines: string[] = [];
    if (match[2]) textLines.push(match[2]);

    // Multi-line for graph
    if (attrType === "graph") {
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (!nextLine.startsWith("//")) break;
        const nextText = nextLine.replace(/^\/\/\s*/, "");
        if (nextText.match(SPEKTA_COMMENT_PATTERN)) break;
        textLines.push(nextText);
        j++;
      }
    }

    entries.push({
      type: attrType,
      text: textLines.join("\n"),
      line: i + 1,
      used: false,
    });
  }

  return entries;
}

function getCommentsBeforeLine(comments: CommentEntry[], targetLine: number): Attribute[] {
  const attrs: Attribute[] = [];
  for (const c of comments) {
    if (c.type === "step") continue;
    if (c.line < targetLine && c.line >= targetLine - 20 && !c.used) {
      c.used = true;
      const attr: Attribute = { type: c.type as Attribute["type"] };
      if (c.text) attr.text = c.text;
      attrs.push(attr);
    }
  }
  return attrs;
}
