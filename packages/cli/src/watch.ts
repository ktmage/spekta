import * as fs from "node:fs";
import * as path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import type { SpektaConfig } from "./types.js";
import { build } from "./build.js";

export async function watch(config: SpektaConfig): Promise<void> {
  const specDir = path.resolve(config.spec_dir);

  console.log("Running initial build...");
  await build(config, { mode: "development" });

  // Start Astro dev server
  let astroProcess: ChildProcess | null = null;
  if (config.renderer.web) {
    astroProcess = startAstroDevServer();
  }

  // Watch spec directories
  const watchDirs: string[] = [];
  const featuresDir = path.join(specDir, "features");
  const systemDir = path.join(specDir, "system");
  if (fs.existsSync(featuresDir)) watchDirs.push(featuresDir);
  if (fs.existsSync(systemDir)) watchDirs.push(systemDir);

  console.log(`Watching: ${watchDirs.join(", ")}`);

  let buildTimer: ReturnType<typeof setTimeout> | null = null;

  const onFileChange = (filename: string | null): void => {
    if (filename && !filename.endsWith("_spec.rb")) return;
    if (buildTimer) clearTimeout(buildTimer);
    buildTimer = setTimeout(async () => {
      console.log(`\nSpec file changed${filename ? `: ${filename}` : ""}. Rebuilding...`);
      try {
        await build(config, { mode: "development" });
        console.log("Rebuild complete.");
      } catch (err) {
        console.error("Rebuild failed:", err);
      }
    }, 500);
  };

  const watchers: fs.FSWatcher[] = [];
  for (const dir of watchDirs) {
    const w = fs.watch(dir, { recursive: true }, (_event, filename) => {
      onFileChange(filename);
    });
    watchers.push(w);
  }

  const cleanup = (): void => {
    console.log("\nShutting down...");
    for (const w of watchers) w.close();
    if (astroProcess) astroProcess.kill();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  console.log("Watch mode active. Press Ctrl+C to stop.");
}

function startAstroDevServer(): ChildProcess {
  const rendererWebDir = path.resolve(
    import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname),
    "../../renderers/web",
  );

  console.log(`Starting Astro dev server in: ${rendererWebDir}`);

  const child = spawn("npm", ["run", "dev"], {
    cwd: rendererWebDir,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
  });

  child.stdout?.on("data", (data: Buffer) => {
    const line = data.toString().trim();
    if (line) console.log(`[astro] ${line}`);
  });

  child.stderr?.on("data", (data: Buffer) => {
    const line = data.toString().trim();
    if (line) console.error(`[astro] ${line}`);
  });

  child.on("error", (err) => {
    console.error("Failed to start Astro dev server:", err);
  });

  return child;
}
