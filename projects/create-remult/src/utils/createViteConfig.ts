export function createViteConfig({
  framework,
  withAuth,
  withPlugin,
}: {
  framework: string;
  withAuth: boolean;
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
        withAuth
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
