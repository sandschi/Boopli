import { defineConfig } from "vite";

// The panel is built to a single ES module that the integration serves from
// custom_components/boopli/frontend. The built file is committed, so people
// installing through HACS never need Node.
export default defineConfig({
  build: {
    outDir: "../custom_components/boopli/frontend",
    emptyOutDir: true,
    lib: {
      entry: "src/boopli-panel.ts",
      formats: ["es"],
      fileName: () => "boopli-panel.js",
    },
    minify: true,
    sourcemap: false,
  },
});
