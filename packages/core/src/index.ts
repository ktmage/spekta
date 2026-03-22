import { loadConfig } from "./core/config.js";
import { build } from "./commands/build.js";
import { render } from "./commands/render.js";
import { complete } from "./commands/complete.js";
import { doctor } from "./commands/doctor.js";
import { resolvePluginCommand } from "./core/resolve-plugin-command.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    process.exit(0);
  }

  if (command === "doctor") {
    doctor();
    return;
  }

  const config = loadConfig();

  switch (command) {
    case "build":
      await build(config);
      break;
    case "render":
      await render(config);
      break;
    case "complete":
      await complete(config);
      break;
    default:
      // Try plugin command: "web:dev", "@ktmage/spekta-exporter-web:dev"
      if (command.includes(":")) {
        try {
          const { exporterPlugin, commandName } = await resolvePluginCommand(command, config);
          await exporterPlugin.commands![commandName](config);
        } catch (pluginCommandError: any) {
          console.error(pluginCommandError.message);
          process.exit(1);
        }
      } else {
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
      }
  }
}

function printUsage(): void {
  console.log(`Usage: spekta <command>

Commands:
  build              Run annotators, parse test files, and generate documentation
  render             Parse test files and generate documentation (skip annotators)
  complete           Run annotator plugins to auto-complete comments
  doctor             Check environment and dependencies
  {plugin}:{command} Run a plugin command (e.g. web:dev)`);
}

main();
