import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";

const isDemo = !!process.env.VITE_BUILD_DEMO;

export default defineConfig(({ command }) => {
  if (isDemo) {
    return {
      plugins: [react()],
      root: "src/example",
      base: "/golden-grids/",
      build: {
        outDir: "../../dist-demo",
        emptyOutDir: true,
      },
    };
  }

  return {
    plugins: [
      react(),
      dts({ rollupTypes: true }),
      cssInjectedByJs(),
    ],
    root: command === "serve" ? "src/example" : ".",
    server: {
      open: true,
      port: 5173,
    },
    build: {
      lib: {
        entry: "src/index.ts",
        name: "GoldenGrids",
        fileName: (format) => `golden-grids.${format}.js`,
        formats: ["es", "cjs"],
      },
      rollupOptions: {
        external: ["react", "react-dom"],
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
          },
        },
      },
    },
  };
});
