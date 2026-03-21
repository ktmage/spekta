import { loadConfig } from "./config.js";
import { build } from "./build.js";
import { watch } from "./watch.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    process.exit(0);
  }

  const config = loadConfig();

  switch (command) {
    case "build":
      await build(config, { mode: "production" });
      break;
    case "watch":
      await watch(config);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage(): void {
  console.log(`Usage: spekta <command>

Commands:
  build   Analyze spec files and generate documentation
  watch   Watch spec files and rebuild on changes`);
}

main();
