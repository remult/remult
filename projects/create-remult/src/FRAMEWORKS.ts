import fs from "fs";
import path from "path";
import colors from "picocolors";
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
};

export type ServerInfo = {
  doesNotLikeJsFileSuffix?: boolean;
  display?: string;
  remultServerFunction: string;
  import: string;
  path?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  writeFiles?: (args: WriteFilesArgs) => void;
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

function writeViteProxy({ withAuth, root }: WriteFilesArgs) {
  if (withAuth) {
    const orig = fs.readFileSync(path.join(root, "vite.config.ts"), "utf-8");
    const updated = orig.replace(
      /(proxy:\s*{[\s\S]*?)(\s*})/,
      `$1
      '/auth': 'http://localhost:3002',$2`,
    );
    if (orig === updated) {
      throw new Error("Failed to update vite.config.ts");
    }
    fs.writeFileSync(path.join(root, "vite.config.ts"), updated);
  }
}

export const FRAMEWORKS: Framework[] = [
  {
    name: "react",
    display: "React",
    color: cyan,
    writeFiles: writeViteProxy,
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
    color: cyan,
    writeFiles: writeViteProxy,
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
    },
  },
];

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
    writeFiles: ({ distLocation, withAuth, root, templatesDir }) => {
      fs.writeFileSync(
        path.join(root, "src/server/index.ts"),
        `import express from "express";
${
  withAuth
    ? `import { auth } from "./auth.js";
`
    : ``
}import { api } from "./api.js";

const app = express();

${
  withAuth
    ? `app.set("trust proxy", true);
app.use("/auth/*", auth);
`
    : ``
}app.use(api);

// This code is responsible for serving the frontend files.
const frontendFiles = process.cwd() + "/${distLocation}";
app.use(express.static(frontendFiles));
app.get("/*", (_, res) => {
  res.sendFile(frontendFiles + "/index.html");
});
// end of frontend serving code

app.listen(process.env["PORT"] || 3002, () => console.log("Server started"));
`,
      );
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
} satisfies Record<string, ServerInfo>;
