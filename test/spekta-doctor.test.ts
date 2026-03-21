import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { fixturesDir } from "./helpers.js";

describe("spekta doctor", () => {
  const binPath = path.resolve(import.meta.dirname ?? __dirname, "../packages/cli/bin/spekta.js");

  function runDoctor(cwd: string, env?: Record<string, string>): string {
    try {
      return execSync(`node ${binPath} doctor`, {
        encoding: "utf-8",
        cwd,
        env: { ...process.env, ...env },
      });
    } catch (err: any) {
      return err.stdout || err.stderr || "";
    }
  }

  it("Node.js のバージョンを表示する", () => {
    const output = runDoctor(process.cwd());
    expect(output).toContain("[+] Node.js:");
  });

  describe("プロジェクトディレクトリで実行した場合", () => {
    it(".spekta.yml が見つかると表示する", () => {
      const { dir, cleanup } = { dir: fixturesDir(), cleanup: () => {} };
      try {
        const output = runDoctor(dir);
        expect(output).toContain("[+] .spekta.yml: found");
      } finally {
        cleanup();
      }
    });

    it("spec ディレクトリが見つかると表示する", () => {
      const { dir, cleanup } = { dir: fixturesDir(), cleanup: () => {} };
      try {
        const output = runDoctor(dir);
        expect(output).toContain("spec/features");
      } finally {
        cleanup();
      }
    });
  });
});
