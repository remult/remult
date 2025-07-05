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
  doesNotLikeJsFileSuffix?: boolean;
  componentInfo?: ComponentInfo;

  remultServerFunction: string;
  import: string;
  path?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  requiresTwoTerminal?: boolean;
  writeFiles?: (args: WriteFilesArgs) => void;
  auth?: {
    dependencies?: Record<string, string>;
    template?: string;
  };
};
export type WriteFilesArgs = {
  root: string;
  distLocation: string;
  withAuth: boolean;
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

export const vite_express_key = "express_vite";
export const Servers = {
  express: {
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
