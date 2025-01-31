import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    root: command === "serve" ? "src/example" : ".", // ✅ Dev mode serves example folder
    server: {
      open: true, // ✅ Automatically opens the browser
      port: 5173,
    },
    build: {
      lib: {
        entry: "src/index.ts", // ✅ Correct entry point for library
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
