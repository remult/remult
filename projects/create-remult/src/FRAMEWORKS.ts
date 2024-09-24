import fs from "fs";
import path from "path";
import colors from "picocolors";
import { extractEnvironmentVariables } from "./extractEnvironmentVariables";
const { cyan } = colors;
type ColorFunc = (str: string | number) => string;
export type Framework = {
  name: string;
  display: string;
  color: ColorFunc;
  serverInfo?: ServerInfo;
  distLocation?: (name: string) => string;
  envFile?: string;
  writeFiles?: (args: WriteFilesArgs) => void;
  canWorkWithVitePluginExpress?: boolean;
};

export type ServerInfo = {
  doesNotLikeJsFileSuffix?: boolean;
  display?: string;
  remultServerFunction: string;
  import: string;
  path?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  writeFiles?: (args: WriteFilesArgs & { framework: Framework }) => void;
  auth?: {
    dependencies?: Record<string, string>;
    template?: string;
  };
};
type WriteFilesArgs = {
  root: string;
  distLocation: string;
  withAuth: boolean;
  templatesDir: string;
};

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
  plugins: [${framework}()${withPlugin ? ', express("src/server")' : ""}],${
    !withPlugin
      ? `
  server: {
    proxy: {
      "/api": "http://localhost:3002",${
        withAuth
          ? `
      "/auth": "http://localhost:3002",`
          : ""
      }
    },
  },`
      : ""
  }
});`;
}

export const FRAMEWORKS: Framework[] = [
  {
    name: "react",
    display: "React",
    canWorkWithVitePluginExpress: true,
    color: cyan,
    writeFiles: ({ withAuth, root }) => {
      fs.writeFileSync(
        path.join(root, "vite.config.ts"),
        createViteConfig({
          framework: "react",
          withAuth,
          withPlugin: false,
        }),
      );
    },
  },
  {
    name: "angular",
    display: "Angular",
    color: cyan,
    distLocation: (name: string) => `dist/${name}/browser`,
    writeFiles: ({ withAuth, root }) => {
      if (withAuth) {
        const proxy = JSON.parse(
          fs.readFileSync(path.join(root, "proxy.conf.json"), "utf-8"),
        );
        proxy["/auth"] = {
          target: "http://localhost:3002",
          secure: false,
        };
        fs.writeFileSync(
          path.join(root, "proxy.conf.json"),
          JSON.stringify(proxy, null, 2),
        );
      }
    },
  },
  {
    name: "vue",
    display: "Vue",
    canWorkWithVitePluginExpress: true,
    color: cyan,
    writeFiles: ({ withAuth, root }) => {
      fs.writeFileSync(
        path.join(root, "vite.config.ts"),
        createViteConfig({
          framework: "vue",
          withAuth,
          withPlugin: false,
        }),
      );
    },
  },
  {
    name: "nextjs",
    display: "Next.js",
    color: cyan,
    envFile: ".env.local",
    serverInfo: {
      doesNotLikeJsFileSuffix: true,
      remultServerFunction: "remultNextApp",
      import: "remult-next",
      path: "src/api.ts",
      auth: {
        template: "nextjs",
        dependencies: { "next-auth": "^5.0.0-beta.21" },
      },
    },
    writeFiles: ({ root }) => {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(root, "package.json"), "utf-8"),
      );
      if (packageJson.dependencies["knex"]) {
        fs.writeFileSync(
          path.join(root, "next.config.mjs"),
          `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["knex"],
  },
};

export default nextConfig;
`,
        );
      }
    },
  },
  {
    name: "sveltekit",
    display: "SvelteKit",
    color: cyan,
    serverInfo: {
      remultServerFunction: "remultSveltekit",
      import: "remult-sveltekit",
      path: "src/api.ts",
      doesNotLikeJsFileSuffix: true,
      auth: {
        template: "sveltekit",
        dependencies: {
          "@auth/sveltekit": "^1.5.0",
        },
      },
      writeFiles: ({ root }) => {
        const apiPath = path.join(root, "src/api.ts");

        fs.writeFileSync(
          apiPath,
          adjustEnvVariablesForSveltekit(fs.readFileSync(apiPath, "utf-8")),
        );
      },
    },
  },
  {
    name: "nuxt",
    display: "Nuxt",
    color: cyan,
    serverInfo: {
      remultServerFunction: "remultNuxt",
      import: "remult-nuxt",
      path: "server/api/[...remult].ts",
      writeFiles: ({ root }) => {
        fs.appendFileSync(
          path.join(root, "server/api/[...remult].ts"),
          "\n\nexport default defineEventHandler(api);",
        );
      },
    },
  },
];

export const vite_express_key = "express_vite";
export const Servers = {
  express: {
    display: "Express",
    import: "remult-express",
    remultServerFunction: "remultExpress",
    dependencies: {
      express: "^4.21.0",
    },
    devDependencies: {
      "@types/express": "^4.17.21",
    },
    auth: {
      template: "express",

      dependencies: {
        "@auth/express": "^0.6.1",
      },
    },
    writeFiles: (args) => {
      writeExpressIndex(args);
    },
  },
  fastify: {
    display: "Fastify",
    import: "remult-fastify",
    remultServerFunction: "remultFastify",
    dependencies: {
      "@fastify/static": "^8.0.0",
      fastify: "^5.0.0",
    },
    writeFiles: ({ distLocation, withAuth, root }) => {
      if (withAuth)
        throw new Error(
          "auth not yet implemented for Fastify. Please use Express for now.",
        );
      return fs.writeFileSync(
        path.join(root, "src/server/index.ts"),
        `import Fastify from "fastify";
import { api } from "./api.js";

const app = Fastify();

app.register(api);

// This code is responsible for serving the frontend files.
const frontendFiles = process.cwd() + "/${distLocation}";
app.register(import("@fastify/static"), {
  root: frontendFiles,
  wildcard: false,
});

app.get("/*", (_, reply) => {
  reply.sendFile("index.html");
});
// end of frontend serving code

app.listen({ port: Number(process.env["PORT"] || 3002) }, () =>
  console.log("Server started")
);
`,
      );
    },
  },
  [vite_express_key]: {
    display: "Express vite plugin (experimental)",
    import: "remult-express",
    remultServerFunction: "remultExpress",
    dependencies: {
      express: "^4.21.0",
    },
    devDependencies: {
      "@types/express": "^4.17.21",
      "vite3-plugin-express": "^0.1.10",
    },
    auth: {
      template: "express",
      dependencies: {
        "@auth/express": "^0.6.1",
      },
    },
    writeFiles: (args) => {
      writeExpressIndex({ ...args, vitePlugin: true });
      fs.writeFileSync(
        path.join(args.root, "vite.config.ts"),
        createViteConfig({
          framework: args.framework.name,
          withAuth: args.withAuth,
          withPlugin: true,
        }),
      );
    },
  },
} satisfies Record<string, ServerInfo>;
function writeExpressIndex({
  distLocation,
  withAuth,
  root,
  vitePlugin,
}: WriteFilesArgs & { vitePlugin?: boolean }) {
  let serveExpress = `// This code is responsible for serving the frontend files.
const frontendFiles = process.cwd() + "/${distLocation}";
app.use(express.static(frontendFiles));
app.get("/*", (_, res) => {
  res.sendFile(frontendFiles + "/index.html");
});
// end of frontend serving code

app.listen(process.env["PORT"] || 3002, () => console.log("Server started"));`;
  if (vitePlugin) {
    serveExpress = `if (!process.env['VITE']) {
  ${serveExpress.split("\n").join("\n  ")}
}`;
  }

  fs.writeFileSync(
    path.join(root, "src/server/index.ts"),
    `import express from "express";
${
  withAuth
    ? `import { auth } from "./auth.js";
`
    : ``
}import { api } from "./api.js";

${vitePlugin ? "export " : ""}const app = express();

${
  withAuth
    ? `app.set("trust proxy", true);
app.use("/auth/*", auth);
`
    : ``
}app.use(api);

` + serveExpress,
  );
}

export function adjustEnvVariablesForSveltekit(content: string) {
  const envVars = extractEnvironmentVariables(content);
  if (envVars.length == 0) return content;
  let lines = content.split("\n");
  lines.splice(
    2,
    0,
    `import { ${envVars.join(", ")} } from "$env/static/private";`,
  );

  return lines.join("\n").replace(/process\.env\["(.*?)"\]/g, "$1");
}
