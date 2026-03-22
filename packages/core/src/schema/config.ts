import { z } from "zod/v4";

// プラグインごとの設定。null は設定なし
// as はコアが使う予約フィールド。それ以外はプラグインが自由に定義する
const pluginOptionsSchema = z.object({
  as: z.string().optional(),
}).loose().nullable();

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
