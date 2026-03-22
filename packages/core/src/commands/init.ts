import * as fs from "node:fs";
import * as path from "node:path";

export function init(): void {
  const configPath = path.resolve(".spekta.yml");

  if (fs.existsSync(configPath)) {
    console.error(".spekta.yml already exists.");
    process.exit(1);
  }

  const templatePath = path.resolve(import.meta.dirname ?? ".", "../../.spekta.template.yml");
  const template = fs.readFileSync(templatePath, "utf-8");

  fs.writeFileSync(configPath, template);
  fs.mkdirSync(path.resolve(".spekta"), { recursive: true });

  console.log("Created .spekta.yml and .spekta/ directory.");
  console.log("Edit .spekta.yml to configure your project.");
}
