import * as ts from "typescript";
import type { AnnotatorPlugin, Annotation } from "@ktmage/spekta/plugin";

const plugin: AnnotatorPlugin = {
  name: "vitest",
  filePatterns: ["*.test.ts", "*.spec.ts"],

  annotate(filePath: string, source: string): Annotation[] {
    const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
    const annotations: Annotation[] = [];
    const describeAliases = collectDescribeAliases(sourceFile);

    ts.forEachChild(sourceFile, (node) => {
      let call = getCallExpression(node);
      if (call && isDescribeCall(call, describeAliases)) {
        annotations.push(...extractAnnotations(call, sourceFile, describeAliases, true));
      }
    });

    return annotations;
  },
};

export default plugin;

function extractAnnotations(
  node: ts.CallExpression,
  sourceFile: ts.SourceFile,
  describeAliases: Set<string>,
  isTopLevel: boolean,
): Annotation[] {
  const annotations: Annotation[] = [];
  const title = extractFirstStringArg(node);
  if (!title) return annotations;

  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;

  // Top-level describe → page, nested → section
  annotations.push({
    line,
    type: isTopLevel ? "page" : "section",
    text: title,
  });

  // Recurse into children
  const callback = getCallbackArg(node);
  if (!callback) return annotations;
  const body = (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
    ? callback.body
    : null;
  if (!body || !ts.isBlock(body)) return annotations;

  for (const stmt of body.statements) {
    if (!ts.isExpressionStatement(stmt) || !ts.isCallExpression(stmt.expression)) continue;
    const call = stmt.expression;

    if (isDescribeCall(call, describeAliases)) {
      annotations.push(...extractAnnotations(call, sourceFile, describeAliases, false));
    } else if (isItCall(call)) {
      const itTitle = extractFirstStringArg(call);
      if (itTitle) {
        const itLine = sourceFile.getLineAndCharacterOfPosition(call.getStart()).line + 1;
        annotations.push({ line: itLine, type: "section", text: itTitle });
      }
    }
  }

  return annotations;
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

function getCallExpression(node: ts.Node): ts.CallExpression | null {
  if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
    return node.expression;
  }
  if (ts.isCallExpression(node)) return node;
  return null;
}

function isDescribeCall(node: ts.Node, describeAliases: Set<string>): boolean {
  if (!ts.isCallExpression(node)) return false;
  const expr = node.expression;
  if (ts.isIdentifier(expr) && describeAliases.has(expr.text)) return true;
  if (ts.isCallExpression(expr) && ts.isPropertyAccessExpression(expr.expression)) {
    const obj = expr.expression.expression;
    if (ts.isIdentifier(obj) && describeAliases.has(obj.text)) return true;
  }
  return false;
}

function isItCall(node: ts.Node): boolean {
  if (!ts.isCallExpression(node)) return false;
  const expr = node.expression;
  return ts.isIdentifier(expr) && expr.text === "it";
}

function extractFirstStringArg(node: ts.CallExpression): string | null {
  for (const arg of node.arguments) {
    if (ts.isStringLiteral(arg)) return arg.text;
  }
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
