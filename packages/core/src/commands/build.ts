import type { SpektaConfig } from "../schema/types.js";
import { annotate } from "./annotate.js";
import { render } from "./render.js";

/**
 * Full build pipeline: annotate + render.
 */
export async function build(config: SpektaConfig): Promise<void> {
  await annotate(config);
  await render(config);
}
