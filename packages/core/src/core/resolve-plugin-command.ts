import type { SpektaConfig } from "../schema/types.js";
import type { ExporterPlugin } from "../schema/plugin.js";
import { loadExporterPlugin } from "./load-plugin.js";

const EXPORTER_PATTERN = /^@.+\/spekta-exporter-(.+)$/;
const ANNOTATOR_PATTERN = /^@.+\/spekta-annotator-(.+)$/;

interface ResolvedPluginCommand {
  exporterPlugin: ExporterPlugin;
  commandName: string;
  exporterConfig: Record<string, unknown>;
}

/**
 * Resolve "web:dev" or "@ktmage/spekta-exporter-web:dev" to a plugin + command.
 */
export async function resolvePluginCommand(
  input: string,
  config: SpektaConfig,
): Promise<ResolvedPluginCommand> {
  const colonIndex = input.lastIndexOf(":");
  if (colonIndex === -1) {
    throw new Error(`Invalid plugin command: "${input}". Format: {plugin}:{command}`);
  }

  const pluginPart = input.substring(0, colonIndex);
  const commandName = input.substring(colonIndex + 1);

  if (!commandName) {
    throw new Error(`Missing command name in "${input}".`);
  }

  const { packageName, exporterConfig } = resolvePackageName(pluginPart, config);
  const exporterPlugin = await loadExporterPlugin(packageName);

  if (!exporterPlugin.commands || !exporterPlugin.commands[commandName]) {
    throw new Error(`Plugin "${packageName}" does not have a "${commandName}" command.`);
  }

  return { exporterPlugin, commandName, exporterConfig };
}

function resolvePackageName(
  pluginPart: string,
  config: SpektaConfig,
): { packageName: string; exporterConfig: Record<string, unknown> } {
  if (!config.exporter) {
    throw new Error("No exporters configured in .spekta.yml.");
  }

  // Full package name (starts with @)
  if (pluginPart.startsWith("@")) {
    const exporterConfig = config.exporter[pluginPart];
    if (exporterConfig === undefined) {
      throw new Error(`Exporter "${pluginPart}" is not configured in .spekta.yml.`);
    }
    return {
      packageName: pluginPart,
      exporterConfig: (exporterConfig ?? {}) as Record<string, unknown>,
    };
  }

  // Short name → find matching package
  const matches: Array<{ packageName: string; exporterConfig: Record<string, unknown> }> = [];

  for (const [packageName, rawConfig] of Object.entries(config.exporter)) {
    const shortName = getShortName(packageName, rawConfig);
    if (shortName === pluginPart) {
      matches.push({
        packageName,
        exporterConfig: (rawConfig ?? {}) as Record<string, unknown>,
      });
    }
  }

  if (matches.length === 0) {
    throw new Error(`No exporter found with short name "${pluginPart}". Check your .spekta.yml.`);
  }

  if (matches.length > 1) {
    const packageNames = matches.map(matchedExporter => matchedExporter.packageName).join(", ");
    throw new Error(
      `Short name "${pluginPart}" is ambiguous (${packageNames}). ` +
      `Use "as" field in .spekta.yml or specify the full package name.`
    );
  }

  return matches[0];
}

function getShortName(packageName: string, rawConfig: Record<string, unknown> | null): string | null {
  // "as" field takes priority
  const asName = (rawConfig as Record<string, unknown> | null)?.as;
  if (typeof asName === "string") return asName;

  // Derive from package name
  const exporterMatch = packageName.match(EXPORTER_PATTERN);
  if (exporterMatch) return exporterMatch[1];

  const annotatorMatch = packageName.match(ANNOTATOR_PATTERN);
  if (annotatorMatch) return annotatorMatch[1];

  return null;
}
