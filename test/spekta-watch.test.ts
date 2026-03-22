import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as http from "node:http";
import { spawn, type ChildProcess } from "node:child_process";
import { vitestFixturesDir } from "./helpers.js";

const context = describe;
const binPath = path.resolve(import.meta.dirname ?? __dirname, "../packages/core/bin/spekta.js");

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpGet(url: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = "";
      res.on("data", (chunk: string) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    }).on("error", reject);
  });
}

// [spekta:summary] ファイル変更を監視し、自動リビルドとライブリロードを提供するコマンド。
describe("spekta watch", () => {
  const projectDir = vitestFixturesDir();
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

  context("サーバーが起動している場合", () => {
    it("HTTP でページを配信できること", async () => {
      // [spekta:step] localhost にHTTPリクエストを送信する
      const res = await httpGet(`http://localhost:${port}/`);
      // [spekta:step] ステータスコード 200 が返る
      expect(res.status).toBe(200);
    });

    it("SSE エンドポイントが利用可能であること", async () => {
      // [spekta:step] /__reload エンドポイントにリクエストを送信する
      const res = await new Promise<{ status: number; contentType: string }>((resolve, reject) => {
        http.get(`http://localhost:${port}/__reload`, (res) => {
          resolve({
            status: res.statusCode ?? 0,
            contentType: res.headers["content-type"] ?? "",
          });
          res.destroy();
        }).on("error", reject);
      });
      // [spekta:step] ステータスコード 200 が返る
      expect(res.status).toBe(200);
      // [spekta:step] Content-Type が text/event-stream である
      expect(res.contentType).toBe("text/event-stream");
    });
  });

  context("spec ファイルを変更した場合", () => {
    it("自動でリビルドされること", async () => {
      const specFile = path.join(projectDir, "test/search.test.ts");
      const original = fs.readFileSync(specFile, "utf-8");

      // [spekta:step] テストファイルの内容を変更する
      fs.writeFileSync(specFile, original.replace(
        "キーワードや条件で検索する機能。",
        "キーワードや条件で検索する機能。【テスト更新】",
      ));

      // [spekta:step] "Rebuild complete" の出力を待つ
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

      // [spekta:step] 生成された HTML に変更内容が反映されている
      const webDir = path.join(projectDir, ".spekta/web");
      const pages = fs.readdirSync(webDir).filter((e: string) => {
        const p = path.join(webDir, e);
        return fs.statSync(p).isDirectory() && e !== "images";
      });
      let found = false;
      for (const page of pages) {
        const html = fs.readFileSync(path.join(webDir, page, "index.html"), "utf-8");
        if (html.includes("【テスト更新】")) { found = true; break; }
      }
      expect(found).toBe(true);

      fs.writeFileSync(specFile, original);
    }, 30000);
  });
});
