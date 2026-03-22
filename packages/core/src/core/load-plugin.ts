import * as path from "node:path";
import { createRequire } from "node:module";

/**
 * Load an npm package from the user's project (CWD の node_modules から解決する)。
 */
export async function loadPluginModule(packageName: string): Promise<unknown> {
  const projectRequire = createRequire(path.resolve("package.json"));
  const resolvedPath = projectRequire.resolve(packageName);
  const module = await import(resolvedPath);
  return module.default ?? module;
}
