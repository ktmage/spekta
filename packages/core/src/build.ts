import type { SpektaConfig } from "./types.js";
import { complete } from "./complete.js";
import { render } from "./render.js";

export interface BuildOptions {
  mode: "production" | "development";
}

/**
 * Full build pipeline: complete (annotator) + parse + export.
 */
export async function build(config: SpektaConfig, options: BuildOptions): Promise<void> {
  await complete(config);
  await render(config, options);
}
