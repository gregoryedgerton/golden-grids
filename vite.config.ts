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
        // react/jsx-runtime (and its dev variant) MUST be external alongside
        // react itself: bundling it bakes in the building React's internals —
        // the 4.2.0 bundle inlined React 18's dev jsx-runtime, which touches
        // __SECRET_INTERNALS at module init and crashes under React 19 before
        // a consumer can reach even the framework-free exports. The native
        // build already externalized it; the web build now matches.
        external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
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
