import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";
import type { SpektaConfig } from "../schema/types.js";
import { build } from "./build.js";

const DEFAULT_PORT = 4321;

// SSE clients for hot reload
const sseClients: Set<http.ServerResponse> = new Set();

function notifyReload(): void {
  for (const res of sseClients) {
    res.write("data: reload\n\n");
  }
}

export async function watch(config: SpektaConfig): Promise<void> {
  const targetDir = path.resolve(config.target_dir);
  const webPath = path.resolve(config.renderer.web?.path ?? ".spekta/web");

  console.log("Running initial build...");
  await build(config, { mode: "development" });

  // Start HTTP server
  const server = startServer(webPath);

  // Watch target directory
  const includePatterns = config.include;

  console.log(`Watching: ${targetDir}`);

  let buildTimer: ReturnType<typeof setTimeout> | null = null;

  const onFileChange = (filename: string | null): void => {
    // If include patterns are configured, filter by them
    if (filename && includePatterns) {
      const matchesInclude = includePatterns.some(pattern => filename.endsWith(pattern));
      if (!matchesInclude) return;
    }
    if (buildTimer) clearTimeout(buildTimer);
    buildTimer = setTimeout(async () => {
      console.log(`\nFile changed${filename ? `: ${filename}` : ""}. Rebuilding...`);
      try {
        await build(config, { mode: "development" });
        notifyReload();
        console.log("Rebuild complete.");
      } catch (err) {
        console.error("Rebuild failed:", err);
      }
    }, 500);
  };

  const watcher = fs.watch(targetDir, { recursive: true }, (_event, filename) => {
    onFileChange(filename);
  });

  const cleanup = (): void => {
    console.log("\nShutting down...");
    watcher.close();
    for (const res of sseClients) res.end();
    server.close();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  console.log("Watch mode active. Press Ctrl+C to stop.");
}

function startServer(webPath: string): http.Server {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${DEFAULT_PORT}`);

    // SSE endpoint for hot reload
    if (url.pathname === "/__reload") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      });
      res.write(": connected\n\n");
      sseClients.add(res);
      req.on("close", () => sseClients.delete(res));
      return;
    }

    let filePath = path.join(webPath, url.pathname);

    // Directory → index.html
    if (filePath.endsWith("/") || !path.extname(filePath)) {
      const indexPath = path.join(
        filePath.endsWith("/") ? filePath : filePath,
        "index.html",
      );
      if (fs.existsSync(indexPath)) {
        filePath = indexPath;
      }
    }

    if (!fs.existsSync(filePath)) {
      const notFound = path.join(webPath, "404.html");
      if (fs.existsSync(notFound)) {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        fs.createReadStream(notFound).pipe(res);
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
      return;
    }

    const ext = path.extname(filePath);
    const mimeTypes: Record<string, string> = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
    };

    // Inject reload script into HTML
    if (ext === ".html") {
      let html = fs.readFileSync(filePath, "utf-8");
      html = html.replace("</body>", `<script>${RELOAD_SCRIPT}</script></body>`);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(html);
      return;
    }

    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(res);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${DEFAULT_PORT} is already in use.`);
      process.exit(1);
    }
    throw err;
  });

  server.listen(DEFAULT_PORT, () => {
    console.log(`http://localhost:${DEFAULT_PORT}/`);
  });

  return server;
}

const RELOAD_SCRIPT = `new EventSource("/__reload").onmessage=function(){location.reload()};`;
