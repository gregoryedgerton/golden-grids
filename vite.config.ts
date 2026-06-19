import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";
import path from "path";

const isDemo = !!process.env.VITE_BUILD_DEMO;
const isNative = !!process.env.VITE_BUILD_NATIVE;

const exampleAlias = {
  "@gifcommit/golden-grids": path.resolve(__dirname, "src/index.ts"),
};

export default defineConfig(({ command }) => {
  if (isNative) {
    // React Native entry → dist/native. No CSS injection (RN has no CSS);
    // react-native is left external for the consumer's Metro bundler.
    return {
      // No dts plugin here: vite-plugin-dts' rollupTypes re-rolls the web `types`
      // entry. Native .d.ts is emitted by `tsc -p tsconfig.native.json` instead
      // (see build:native), which preserves the real `import from "react-native"`.
      plugins: [react()],
      build: {
        outDir: "dist/native",
        emptyOutDir: false, // keep the web build's dist/ output intact
        copyPublicDir: false, // RN bundle doesn't need the web demo's public/ assets
        lib: {
          entry: "src/native/index.ts",
          fileName: (format) => `golden-grids-native.${format}.js`,
          formats: ["es", "cjs"],
        },
        rollupOptions: {
          external: ["react", "react/jsx-runtime", "react-native"],
        },
      },
    };
  }

  if (isDemo) {
    return {
      plugins: [react()],
      root: "example",
      base: "/golden-grids/",
      resolve: { alias: exampleAlias },
      build: {
        outDir: "../dist-demo",
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
    root: command === "serve" ? "example" : ".",
    resolve: command === "serve" ? { alias: exampleAlias } : {},
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
