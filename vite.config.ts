import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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
    plugins: [react()],
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
