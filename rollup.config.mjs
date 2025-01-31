import postcss from 'rollup-plugin-postcss';
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import dts from "rollup-plugin-dts";

export default [
  {
    input: "index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json" }),
      postcss({
        extensions: ['.css'],
      }),
    ],
  },
  {
    input: "index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [
      dts(),
    ],
    external: [/\.css$/], // Exclude CSS files from type definition build
  },
];
