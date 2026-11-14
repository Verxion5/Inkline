import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

/**
 * Vite + TanStack Start configuration for Inkline.
 *
 * - dev: the TanStack Start dev server (router codegen, HMR, SSR)
 * - build: client + SSR bundles, with Nitro emitting the deployable server
 */
export default defineConfig(({ command }) => ({
  server: {
    host: "0.0.0.0",
    port: Number(process.env["PORT"] ?? 3000),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error
      // wrapper). nitro/vite builds from this.
      server: { entry: "server" },
    }),
    viteReact(),
    // Nitro only produces output during a production build.
    ...(command === "build" ? [nitro()] : []),
  ],
}));
