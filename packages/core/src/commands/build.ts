import type { SpektaConfig } from "../schema/types.js";
import { complete } from "./complete.js";
import { render } from "./render.js";

/**
 * Full build pipeline: complete (annotator) + parse + export.
 */
export async function build(config: SpektaConfig): Promise<void> {
  await complete(config);
  await render(config);
}
