import * as fs from "node:fs";
import * as path from "node:path";
import type { SpektaConfig } from "../schema/types.js";
import { build } from "./build.js";
import { startDevServer } from "../core/dev-server.js";

const DEFAULT_PORT = 4321;
const DEBOUNCE_MS = 500;

export async function watch(config: SpektaConfig): Promise<void> {
  const targetDir = path.resolve(config.target_dir);
  const outputDir = findOutputDir(config);

  console.log("Running initial build...");
  await build(config);

  const devServer = startDevServer(outputDir, DEFAULT_PORT);

  console.log(`Watching: ${targetDir}`);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const onFileChange = (filename: string | null): void => {
    if (filename && config.include) {
      const matchesInclude = config.include.some(pattern => filename.endsWith(pattern));
      if (!matchesInclude) return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`\nFile changed${filename ? `: ${filename}` : ""}. Rebuilding...`);
      try {
        await build(config);
        devServer.notifyReload();
        console.log("Rebuild complete.");
      } catch (buildError) {
        console.error("Rebuild failed:", buildError);
      }
    }, DEBOUNCE_MS);
  };

  const fileWatcher = fs.watch(targetDir, { recursive: true }, (_event, filename) => {
    onFileChange(filename);
  });

  const cleanup = (): void => {
    console.log("\nShutting down...");
    fileWatcher.close();
    devServer.close();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  console.log("Watch mode active. Press Ctrl+C to stop.");
}

/**
 * Find the first exporter's output directory for dev server.
 */
function findOutputDir(config: SpektaConfig): string {
  if (config.exporter) {
    for (const exporterConfig of Object.values(config.exporter)) {
      const configPath = (exporterConfig as Record<string, unknown> | null)?.path;
      if (typeof configPath === "string") {
        return path.resolve(configPath);
      }
    }
  }
  return path.resolve(".spekta/web");
}
