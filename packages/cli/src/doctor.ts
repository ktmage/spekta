import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

export function doctor(): void {
  console.log("Spekta Doctor\n");

  let ok = true;

  ok = check("Node.js", () => {
    const version = process.version;
    return { ok: true, detail: version };
  }) && ok;

  ok = check("Ruby", () => {
    try {
      const version = execSync("ruby --version", { encoding: "utf-8" }).trim();
      const match = version.match(/ruby (\d+)\.(\d+)/);
      if (match) {
        const major = parseInt(match[1]);
        const minor = parseInt(match[2]);
        if (major < 3 || (major === 3 && minor < 3)) {
          return { ok: false, detail: `${version} (3.3+ required for Prism)` };
        }
      }
      return { ok: true, detail: version };
    } catch {
      return { ok: false, detail: "not found" };
    }
  }) && ok;

  ok = check("Bundler", () => {
    try {
      const version = execSync("bundle --version", { encoding: "utf-8" }).trim();
      return { ok: true, detail: version };
    } catch {
      return { ok: false, detail: "not found" };
    }
  }) && ok;

  ok = check("spekta-analyzer-rspec", () => {
    try {
      execSync("bundle exec ruby -e 'require \"spekta/analyzer_rspec\"'", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return { ok: true, detail: "installed" };
    } catch {
      return { ok: false, detail: "not found in Gemfile" };
    }
  }) && ok;

  ok = check(".spekta.yml", () => {
    if (fs.existsSync(".spekta.yml")) {
      return { ok: true, detail: "found" };
    }
    return { ok: false, detail: "not found" };
  }) && ok;

  ok = check("spec directory", () => {
    const dirs = ["spec/features", "spec/system"];
    const found = dirs.filter(d => fs.existsSync(d));
    if (found.length > 0) {
      return { ok: true, detail: found.join(", ") };
    }
    return { ok: false, detail: "no spec/features or spec/system found" };
  }) && ok;

  ok = check("Pandoc (optional)", () => {
    try {
      const version = execSync("pandoc --version", { encoding: "utf-8" }).split("\n")[0];
      return { ok: true, detail: version };
    } catch {
      return { ok: true, detail: "not installed (PDF output unavailable)" };
    }
  }) && ok;

  console.log("");
  if (ok) {
    console.log("All checks passed.");
  } else {
    console.log("Some checks failed. Fix the issues above to use Spekta.");
    process.exit(1);
  }
}

function check(name: string, fn: () => { ok: boolean; detail: string }): boolean {
  const result = fn();
  const icon = result.ok ? "+" : "x";
  console.log(`  [${icon}] ${name}: ${result.detail}`);
  return result.ok;
}
