import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { fixturesDir, isRubyAvailable } from "./helpers.js";

const rubyAvailable = isRubyAvailable();
const binPath = path.resolve(import.meta.dirname ?? __dirname, "../packages/cli/bin/spekta.js");

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    }).on("error", reject);
  });
}

describe.runIf(rubyAvailable)("spekta watch", () => {
  const projectDir = fixturesDir();
  let watchProcess: ChildProcess;
  const port = 4321;

  beforeAll(async () => {
    fs.rmSync(path.join(projectDir, ".spekta"), { recursive: true, force: true });

    watchProcess = spawn("node", [binPath, "watch"], {
      cwd: projectDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    await new Promise<void>((resolve) => {
      const handler = (data: Buffer) => {
        if (data.toString().includes("localhost")) {
          watchProcess.stdout?.off("data", handler);
          resolve();
        }
      };
      watchProcess.stdout?.on("data", handler);
    });
    await waitFor(1000);
  }, 30000);

  afterAll(() => {
    watchProcess?.kill();
    fs.rmSync(path.join(projectDir, ".spekta"), { recursive: true, force: true });
  });

  it("HTTP サーバーが起動してページを配信できる", async () => {
    const res = await httpGet(`http://localhost:${port}/`);
    expect(res.status).toBe(200);
  });

  it("spec ファイルを変更するとリビルドされる", async () => {
    const specFile = path.join(projectDir, "spec/features/search_spec.rb");
    const original = fs.readFileSync(specFile, "utf-8");

    fs.writeFileSync(specFile, original.replace(
      "キーワードや条件で検索する機能。",
      "キーワードや条件で検索する機能。【テスト更新】",
    ));

    await new Promise<void>((resolve) => {
      const handler = (data: Buffer) => {
        if (data.toString().includes("Rebuild complete")) {
          watchProcess.stdout?.off("data", handler);
          resolve();
        }
      };
      watchProcess.stdout?.on("data", handler);
    });
    await waitFor(500);

    // Find the search page and verify updated content
    const webDir = path.join(projectDir, ".spekta/web");
    const pages = fs.readdirSync(webDir).filter(e => {
      const p = path.join(webDir, e);
      return fs.statSync(p).isDirectory() && e !== "images";
    });
    let found = false;
    for (const page of pages) {
      const html = fs.readFileSync(path.join(webDir, page, "index.html"), "utf-8");
      if (html.includes("【テスト更新】")) { found = true; break; }
    }
    expect(found).toBe(true);

    // Restore
    fs.writeFileSync(specFile, original);
  }, 30000);

  it("SSE エンドポイントが利用可能である", async () => {
    const res = await new Promise<{ status: number; contentType: string }>((resolve, reject) => {
      http.get(`http://localhost:${port}/__reload`, (res) => {
        resolve({
          status: res.statusCode ?? 0,
          contentType: res.headers["content-type"] ?? "",
        });
        res.destroy();
      }).on("error", reject);
    });
    expect(res.status).toBe(200);
    expect(res.contentType).toBe("text/event-stream");
  });
});
