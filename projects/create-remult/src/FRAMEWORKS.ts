import colors from 'picocolors'
const { cyan } = colors
type ColorFunc = (str: string | number) => string
export type Framework = {
  name: string
  display: string
  color: ColorFunc
  serverInfo?: ServerInfo
  distLocation?: (name: string) => string
  envFile?: string
}

export type ServerInfo = {
  display?: string
  remultServerFunction: string
  import: string
  path?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  indexTs?: (distLocation: string) => string
}

export const FRAMEWORKS: Framework[] = [
  {
    name: 'react',
    display: 'React',
    color: cyan,
  },
  {
    name: 'angular',
    display: 'Angular',
    color: cyan,
    distLocation: (name: string) => `dist/${name}/browser`,
  },
  {
    name: 'vue',
    display: 'Vue',
    color: cyan,
  },
  {
    name: 'nextjs',
    display: 'Next.js',
    color: cyan,
    envFile: '.env.local',
    serverInfo: {
      remultServerFunction: 'remultNextApp',
      import: 'remult-next',
      path: 'src/api.ts',
    },
  },
  {
    name: 'sveltekit',
    display: 'SvelteKit',
    color: cyan,
    serverInfo: {
      remultServerFunction: 'remultSveltekit',
      import: 'remult-sveltekit',
      path: 'src/api.ts',
    },
  },
]

export const Servers = {
  express: {
    display: 'Express',
    import: 'remult-express',
    remultServerFunction: 'remultExpress',
    dependencies: {
      express: '^4.21.0',
    },
    devDependencies: {
      '@types/express': '^4.17.21',
    },
    indexTs: (distLocation: string) => `import express from "express";
import { api } from "./api.js";

const app = express();

app.use(api);

// This code is responsible for serving the frontend files.
const frontendFiles = process.cwd() + "/${distLocation}";
app.use(express.static(frontendFiles));
app.get("/*", (_, res) => {
  res.sendFile(frontendFiles + "/index.html");
});
// end of frontend serving code

app.listen(process.env["PORT"] || 3002, () => console.log("Server started"));
`,
  },
  fastify: {
    display: 'Fastify',
    import: 'remult-fastify',
    remultServerFunction: 'remultFastify',
    dependencies: {
      '@fastify/static': '^8.0.0',
      fastify: '^5.0.0',
    },
    indexTs: (distLocation: string) => `import Fastify from "fastify";
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
  },
} satisfies Record<string, ServerInfo>
