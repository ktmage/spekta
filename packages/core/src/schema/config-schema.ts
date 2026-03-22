import { z } from "zod/v4";
import { stringify as toYaml } from "yaml";

export const spektaConfigSchema = z.object({
  target_dir: z.string().default("test/").describe("対象ディレクトリ"),
  include: z.array(z.string()).optional().describe("対象ファイルの拡張子パターン"),
  exclude: z.array(z.string()).optional().describe("除外パターン"),
  annotator: z.record(z.string(), z.record(z.string(), z.unknown()).nullable()).optional().describe("Annotator プラグイン"),
  exporter: z.record(z.string(), z.record(z.string(), z.unknown()).nullable()).optional().describe("Exporter プラグイン"),
});

export type SpektaConfig = z.infer<typeof spektaConfigSchema>;

/**
 * Generate a commented YAML template from the config schema's defaults.
 */
export function generateConfigTemplate(): string {
  const exampleConfig: Record<string, unknown> = {
    target_dir: "test/",
    include: [".test.ts"],
    annotator: {
      "@ktmage/spekta-annotator-vitest": null,
    },
    exporter: {
      "@ktmage/spekta-exporter-web": { name: "My Project" },
      "@ktmage/spekta-exporter-markdown": null,
    },
  };

  const yamlString = toYaml(exampleConfig, { nullStr: "" });

  // Comment out all lines
  const commentedLines = yamlString
    .split("\n")
    .map(line => (line.trim() === "" ? "" : `# ${line}`))
    .join("\n");

  return `# .spekta.yml\n${commentedLines}`;
}
