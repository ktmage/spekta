import * as path from "node:path";
import { createRequire } from "node:module";
import type { AnnotatorPlugin } from "../schema/plugin.js";
import type { ExporterPlugin } from "../schema/plugin.js";

/**
 * Load an npm package from the user's project (CWD の node_modules から解決する)。
 */
async function loadPluginModule(packageName: string): Promise<unknown> {
  const projectRequire = createRequire(path.resolve("package.json"));
  const resolvedPath = projectRequire.resolve(packageName);
  const module = await import(resolvedPath);
  return module.default ?? module;
}

function isAnnotatorPlugin(value: unknown): value is AnnotatorPlugin {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.name === "string"
    && Array.isArray(obj.filePatterns)
    && typeof obj.annotate === "function";
}

function isExporterPlugin(value: unknown): value is ExporterPlugin {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.name === "string"
    && typeof obj.defaultOutputDir === "string"
    && typeof obj.export === "function";
}

export async function loadAnnotatorPlugin(packageName: string): Promise<AnnotatorPlugin> {
  const plugin = await loadPluginModule(packageName);
  if (!isAnnotatorPlugin(plugin)) {
    throw new Error(`"${packageName}" is not a valid AnnotatorPlugin.`);
  }
  return plugin;
}

export async function loadExporterPlugin(packageName: string): Promise<ExporterPlugin> {
  const plugin = await loadPluginModule(packageName);
  if (!isExporterPlugin(plugin)) {
    throw new Error(`"${packageName}" is not a valid ExporterPlugin.`);
  }
  return plugin;
}
