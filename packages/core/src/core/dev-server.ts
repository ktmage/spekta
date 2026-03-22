import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";

const RELOAD_SCRIPT = `new EventSource("/__reload").onmessage=function(){location.reload()};`;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

export interface DevServer {
  notifyReload(): void;
  close(): void;
}

export function startDevServer(staticDir: string, port: number): DevServer {
  const sseClients: Set<http.ServerResponse> = new Set();

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);

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

    serveStaticFile(staticDir, url.pathname, res);
  });

  server.on("error", (serverError: NodeJS.ErrnoException) => {
    if (serverError.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use.`);
      process.exit(1);
    }
    throw serverError;
  });

  server.listen(port, () => {
    console.log(`http://localhost:${port}/`);
  });

  return {
    notifyReload() {
      for (const sseClient of sseClients) {
        sseClient.write("data: reload\n\n");
      }
    },
    close() {
      for (const sseClient of sseClients) sseClient.end();
      server.close();
    },
  };
}

function serveStaticFile(staticDir: string, pathname: string, res: http.ServerResponse): void {
  let filePath = path.join(staticDir, pathname);

  if (filePath.endsWith("/") || !path.extname(filePath)) {
    const indexPath = path.join(filePath, "index.html");
    if (fs.existsSync(indexPath)) {
      filePath = indexPath;
    }
  }

  if (!fs.existsSync(filePath)) {
    const notFoundPath = path.join(staticDir, "404.html");
    if (fs.existsSync(notFoundPath)) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(notFoundPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
    return;
  }

  const ext = path.extname(filePath);

  if (ext === ".html") {
    let html = fs.readFileSync(filePath, "utf-8");
    html = html.replace("</body>", `<script>${RELOAD_SCRIPT}</script></body>`);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(html);
    return;
  }

  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(res);
}
