import { loadConfig } from "./core/config.js";
import { build } from "./commands/build.js";
import { render } from "./commands/render.js";
import { complete } from "./commands/complete.js";
import { watch } from "./commands/watch.js";
import { doctor } from "./commands/doctor.js";

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
  build      Run annotators, parse test files, and generate documentation
  render     Parse test files and generate documentation (skip annotators)
  complete   Run annotator plugins to auto-complete comments
  watch      Watch test files and rebuild on changes
  doctor     Check environment and dependencies`);
}

main();
