import { AuthInfo } from "../AUTH.js";

export function createViteConfig({
  framework,
  authInfo,
  withPlugin,
}: {
  framework: string;
  authInfo: AuthInfo | undefined | null;
  withPlugin: boolean;
}) {
  return `import { defineConfig } from "vite";
import ${framework} from "@vitejs/plugin-${framework}";
${withPlugin ? `import express from 'vite3-plugin-express';\n` : ""}
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [${framework}()${withPlugin ? ', express("src/server")' : ""}],
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
      },
    },
  },${
    !withPlugin
      ? `
  server: {
    proxy: {
      "/api": "http://localhost:3002",${
        authInfo
          ? `
      "/auth": {
        target: "http://localhost:3002",
        changeOrigin: false,
      },`
          : ""
      }
    },
  },`
      : ""
  }
});`;
}
