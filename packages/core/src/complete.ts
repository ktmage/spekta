import type { SpektaConfig } from "./types.js";

/**
 * Run annotator plugins to auto-complete [spekta:*] comments in test files.
 * Currently a placeholder — annotator plugins are not yet implemented.
 */
export async function complete(_config: SpektaConfig): Promise<void> {
  console.log("No annotator plugins configured. Skipping complete step.");
}
