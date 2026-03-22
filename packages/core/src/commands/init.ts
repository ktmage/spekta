import * as fs from "node:fs";
import * as path from "node:path";
import { CONFIG_TEMPLATE } from "../schema/config.js";

export function init(): void {
  const configPath = path.resolve(".spekta.yml");

  if (fs.existsSync(configPath)) {
    console.error(".spekta.yml already exists.");
    process.exit(1);
  }

  fs.writeFileSync(configPath, CONFIG_TEMPLATE);
  fs.mkdirSync(path.resolve(".spekta"), { recursive: true });

  console.log("Created .spekta.yml and .spekta/ directory.");
  console.log("Edit .spekta.yml to configure your project.");
}
