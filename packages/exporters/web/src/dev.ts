import * as fs from "node:fs";
import * as path from "node:path";
import { startDevServer } from "./dev-server.js";
import type { SpektaConfig } from "@ktmage/spekta/types";

const DEFAULT_PORT = 4321;
const DEBOUNCE_MS = 500;

export async function dev(config: SpektaConfig): Promise<void> {
  const { build, render } = await import("@ktmage/spekta/commands");

  const targetDir = path.resolve(config.target_dir);
  const outputDir = findOutputDir(config);
  const webExporterConfig = findWebExporterConfig(config);
  const autoComplete = webExporterConfig?.auto_complete === true;

  if (autoComplete) {
    console.log("auto_complete: enabled (unstable)");
  }

  let isRebuilding = false;

  console.log("Running initial build...");
  isRebuilding = true;
  await build(config);
  await new Promise(resolve => setTimeout(resolve, 1000));
  isRebuilding = false;

  const devServer = startDevServer(outputDir, DEFAULT_PORT);

  console.log(`Watching: ${targetDir}`);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const onFileChange = (filename: string | null): void => {
    if (isRebuilding) return;
    if (filename && config.include) {
      const matchesInclude = config.include.some(pattern => filename.endsWith(pattern));
      if (!matchesInclude) return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      console.log(`\nFile changed${filename ? `: ${filename}` : ""}. Rebuilding...`);
      isRebuilding = true;
      try {
        if (autoComplete) {
          await build(config);
        } else {
          await render(config);
        }
        devServer.notifyReload();
        console.log("Rebuild complete.");
      } catch (buildError) {
        console.error("Rebuild failed:", buildError);
      } finally {
        setTimeout(() => { isRebuilding = false; }, 1000);
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

function findWebExporterConfig(config: SpektaConfig): Record<string, unknown> | null {
  if (!config.exporter) return null;
  for (const [packageName, exporterConfig] of Object.entries(config.exporter)) {
    if (packageName.includes("exporter-web")) {
      return (exporterConfig ?? {}) as Record<string, unknown>;
    }
  }
  return null;
}
