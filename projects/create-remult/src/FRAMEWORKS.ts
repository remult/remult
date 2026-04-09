import fs from "fs";
import path from "path";
import { createViteConfig } from "./utils/createViteConfig";
import { react } from "./frameworks/react";
import type { DatabaseType } from "./DATABASES";
import { nextJs } from "./frameworks/nextjs";
import { svelteKit } from "./frameworks/sveltekit";
import { vue } from "./frameworks/vue";
import { angular } from "./frameworks/angular";
import { nuxt } from "./frameworks/nuxt";
import type { ComponentInfo } from "./utils/prepareInfoReadmeAndHomepage";
import { AuthInfo } from "./AUTH.js";

type ColorFunc = (str: string | number) => string;
export type Framework = {
  name: string;
  display: string;
  url: string;
  color?: ColorFunc;
  serverInfo?: ServerInfo;
  distLocation?: (name: string) => string;
  envFile?: string;
  writeFiles?: (args: WriteFilesArgs) => void;
  canWorkWithVitePluginExpress?: boolean;
  componentFileSuffix?: string;
};

export type ServerInfo = {
  name: string;
  doesNotLikeJsFileSuffix?: boolean;
  componentInfo?: ComponentInfo;

  remultServerFunction: string;
  import: string;
  path?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  requiresTwoTerminal?: boolean;
  writeFiles?: (args: WriteFilesArgs) => void;
  authImplementedReason?: "not-yet";
};
export type WriteFilesArgs = {
  root: string;
  distLocation: string;
  authInfo: AuthInfo | undefined | null;
  templatesDir: string;
  framework: Framework;
  server: ServerInfo;
  crud: boolean;
  admin: boolean;
  db: DatabaseType;
  copyDir: (from: string, to: string) => void;
  projectName: string;
  envVariables: envVariable[];
};
export type envVariable = {
  key: string;
  comment?: string;
  value?: string;
  optional?: boolean;
};

export const FRAMEWORKS: Framework[] = [
  react,
  angular,
  vue,
  nextJs,
  svelteKit,
  nuxt,
];

const expressVersions = {
  dependencies: {
    express: "^5.1.0",
  },
  devDependencies: {
    "@types/express": "^5.0.3",
  },
};

export const vite_express_key = "express-vite";
export const Servers = {
  express: {
    name: "express",
    componentInfo: {
      display: "Express",
      url: "https://expressjs.com/",
      type: "Server",
      description: "Fast, unopinionated, minimalist web framework for Node.js",
      emoji: "🛤️",
    },
    import: "remult-express",
    remultServerFunction: "remultApi",
    requiresTwoTerminal: true,
    dependencies: {
      ...expressVersions.dependencies,
    },
    devDependencies: {
      ...expressVersions.devDependencies,
    },
    writeFiles: (args) => {
      writeExpressIndex(args);
    },
  },
  fastify: {
    name: "fastify",
    componentInfo: {
      display: "Fastify",
      url: "https://www.fastify.io/",
      type: "Server",
      description: "Fast and low overhead web framework, for Node.js",
      emoji: "🚀",
    },
    import: "remult-fastify",
    remultServerFunction: "remultApi",
    requiresTwoTerminal: true,
    dependencies: {
      "@fastify/static": "^8.0.0",
      fastify: "^5.0.0",
    },
    devDependencies: {
      "@types/node": "^22.7.7",
    },
    authImplementedReason: "not-yet",
    writeFiles: ({ distLocation, authInfo, root }) => {
      if (authInfo)
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
    name: "express-vite",
    componentInfo: {
      display: "Express vite plugin (experimental)",
      url: "https://expressjs.com/",
      type: "Server",
      description: "Experimental Vite plugin for Express",
      emoji: "🔥",
    },
    import: "remult-express",
    remultServerFunction: "remultApi",
    dependencies: {
      ...expressVersions.dependencies,
    },
    devDependencies: {
      ...expressVersions.devDependencies,
      "vite3-plugin-express": "^0.1.10",
    },
    writeFiles: (args) => {
      writeExpressIndex({ ...args, vitePlugin: true });
      fs.writeFileSync(
        path.join(args.root, "vite.config.ts"),
        createViteConfig({
          framework: args.framework.name,
          authInfo: args.authInfo,
          withPlugin: true,
        }),
      );
    },
  },
} satisfies Record<string, ServerInfo>;
function writeExpressIndex({
  distLocation,
  authInfo,
  root,
  vitePlugin,
}: WriteFilesArgs & { vitePlugin?: boolean }) {
  let serveExpress = `// This code is responsible for serving the frontend files.
const frontendFiles = process.cwd() + "/${distLocation}";
app.use(express.static(frontendFiles));
app.get("/*splat", (_, res) => {
  res.sendFile(frontendFiles + "/index.html");
});
// end of frontend serving code

app.listen(process.env["PORT"] || 3002, () => console.log("Server started"));`;
  if (vitePlugin) {
    serveExpress = `if (!process.env['VITE']) {
  ${serveExpress.split("\n").join("\n  ")}
}`;
  }

  const getAuthImportPart = () => {
    if (authInfo?.name === "better-auth") {
      return `import { auth } from "../demo/auth/server/auth.js";
import { toNodeHandler } from "better-auth/node";
`;
    }
    return ``;
  };

  const getAuthCodePart = () => {
    if (authInfo?.name === "better-auth") {
      return `app.all("/api/auth/*splat", toNodeHandler(auth));
`;
    }
    return ``;
  };

  fs.writeFileSync(
    path.join(root, "src/server/index.ts"),
    `import express from "express";
${getAuthImportPart()}import { api } from "./api.js";

${vitePlugin ? "export " : ""}const app = express();

${getAuthCodePart()}app.use(api);

` + serveExpress,
  );
}
