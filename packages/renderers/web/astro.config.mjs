import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import { resolve } from "node:path";

export default defineConfig({
  integrations: [preact()],
  output: "static",
  vite: {
    plugins: [
      {
        name: "watch-ir-data",
        configureServer(server) {
          const dataDir = resolve("public/data");
          server.watcher.add(dataDir);
          server.watcher.on("change", (file) => {
            if (file.startsWith(dataDir)) {
              // Clear Astro's route cache so getStaticPaths() re-runs
              // Try multiple ways to send the event
try { server.environments?.ssr?.hot?.send("astro:content-changed", {}); } catch {}
try { server.hot.send("astro:content-changed", {}); } catch {}
              server.ws.send({ type: "full-reload" });
            }
          });
        },
      },
    ],
  },
});
