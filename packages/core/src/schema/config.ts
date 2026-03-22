import { z } from "zod/v4";
import { stringify as toYaml } from "yaml";

// プラグインごとの設定（name, as, path 等）。null は設定なし
const pluginOptionsSchema = z.record(z.string(), z.unknown()).nullable();

// パッケージ名のパターン
const annotatorPackageName = z.string().regex(
  /^@[\w-]+\/spekta-annotator-[\w-]+$/,
  "Annotator package name must match @{scope}/spekta-annotator-{name}",
);
const exporterPackageName = z.string().regex(
  /^@[\w-]+\/spekta-exporter-[\w-]+$/,
  "Exporter package name must match @{scope}/spekta-exporter-{name}",
);

const annotatorMapSchema = z.record(annotatorPackageName, pluginOptionsSchema);
const exporterMapSchema = z.record(exporterPackageName, pluginOptionsSchema);

export const spektaConfigSchema = z.object({
  target_dir: z.string(),
  include:    z.array(z.string()).optional(),
  exclude:    z.array(z.string()).optional(),
  annotator:  annotatorMapSchema.optional(),
  exporter:   exporterMapSchema,
});

export type SpektaConfig = z.infer<typeof spektaConfigSchema>;

/**
 * Generate a commented YAML template from the config schema.
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

  const commentedLines = yamlString
    .split("\n")
    .map(line => (line.trim() === "" ? "" : `# ${line}`))
    .join("\n");

  return `# .spekta.yml\n${commentedLines}`;
}
