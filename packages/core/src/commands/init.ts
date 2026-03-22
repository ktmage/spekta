import * as fs from "node:fs";
import * as path from "node:path";

const TEMPLATE = `# .spekta.yml
# target_dir: test/
# include:
#   - ".test.ts"

# annotator:
#   "@ktmage/spekta-annotator-vitest":

# exporter:
#   "@ktmage/spekta-exporter-web":
#     name: "My Project"
#   "@ktmage/spekta-exporter-markdown":
`;

export function init(): void {
  const configPath = path.resolve(".spekta.yml");

  if (fs.existsSync(configPath)) {
    console.error(".spekta.yml already exists.");
    process.exit(1);
  }

  fs.writeFileSync(configPath, TEMPLATE);
  fs.mkdirSync(path.resolve(".spekta"), { recursive: true });

  console.log("Created .spekta.yml and .spekta/ directory.");
  console.log("Edit .spekta.yml to configure your project.");
}
