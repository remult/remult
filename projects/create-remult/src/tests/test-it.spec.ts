import { expect, test, describe } from "vitest";
import spawn from "cross-spawn";
import fs from "fs";
import { emptyDir } from "../utils/empty-dir";
import { setTimeout } from "timers/promises";
import {
  FRAMEWORKS,
  Servers,
  vite_express_key,
  type ServerInfo,
  type WriteFilesArgs,
} from "../FRAMEWORKS";
import { createViteConfig } from "../utils/createViteConfig";
import { DATABASES } from "../DATABASES";

import path from "path";
import { react, writeAppTsxAndReadme } from "../frameworks/react";

import { nextJs, removeJs } from "../frameworks/nextjs";
import { adjustEnvVariablesForSveltekit } from "../frameworks/sveltekit";
import { buildApiFile } from "../utils/buildApiFile";
import { Auths } from "../AUTH.js";

describe("api file variations", async () => {
  test("basic", () => {
    expect(buildApiFile(DATABASES.json, Servers.express, null, false, false))
      .toMatchInlineSnapshot(`
        "import { remultApi } from "remult/remult-express";
          
        export const api = remultApi({});"
      `);
  });
  test("with db", () => {
    expect(
      buildApiFile(DATABASES.postgres, Servers.express, null, false, false),
    ).toMatchInlineSnapshot(`
      "import { remultApi } from "remult/remult-express";
      import { createPostgresDataProvider } from "remult/postgres";
        
      export const api = remultApi({
        dataProvider: createPostgresDataProvider({
          connectionString: process.env["DATABASE_URL"]    
        }),
      });"
    `);
  });
  test("with db and auth", () => {
    expect(
      buildApiFile(
        DATABASES.postgres,
        Servers.express,
        Auths["better-auth"],
        false,
        false,
      ),
    ).toMatchInlineSnapshot(`
      "import { remultApi } from "remult/remult-express";
      import { createPostgresDataProvider } from "remult/postgres";
      import { getUserFromRequest } from "../demo/auth/server/auth.js";
      import { auth } from "../demo/auth/server/index.js";
        
      export const api = remultApi({
        dataProvider: createPostgresDataProvider({
          connectionString: process.env["DATABASE_URL"]    
        }),
        getUser: getUserFromRequest,
        modules: [auth()],
      });"
    `);
  });
  test("with db and auth svelteKit", () => {
    expect(
      adjustEnvVariablesForSveltekit(
        buildApiFile(
          DATABASES.mssql,
          FRAMEWORKS.find((x) => x.name === "sveltekit")?.serverInfo!,
          Auths["better-auth"],
          false,
          false,
        ),
      ),
    ).toMatchInlineSnapshot(`
      "import { remultApi } from "remult/remult-sveltekit";
      import { createKnexDataProvider } from "remult/remult-knex";
      import { MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD, MSSQL_INSTANCE } from "$env/static/private";
      import { building } from "$app/environment";
      import { getUserFromRequest } from "../demo/auth/server/auth";
      import { auth } from "../demo/auth/server/index";
        
      export const api = remultApi({
        dataProvider: building ? undefined : createKnexDataProvider({
          client: "mssql",
          connection: {
            server: MSSQL_SERVER,
            database: MSSQL_DATABASE,
            user: MSSQL_USER,
            password: MSSQL_PASSWORD,
            options: {
              enableArithAbort: true,
              encrypt: false,
              instanceName: MSSQL_INSTANCE,
            },
          }
        }),
        getUser: getUserFromRequest,
        modules: [auth()],
      });"
    `);
  });
  test("with db and auth svelteKit", () => {
    expect(
      adjustEnvVariablesForSveltekit(
        buildApiFile(
          DATABASES.mongodb,
          FRAMEWORKS.find((x) => x.name === "sveltekit")?.serverInfo!,
          Auths["better-auth"],
          false,
          false,
        ),
      ),
    ).toMatchInlineSnapshot(`
      "import { remultApi } from "remult/remult-sveltekit";
      import { MongoClient } from "mongodb";
      import { MONGO_URL, MONGO_DB } from "$env/static/private";
      import { building } from "$app/environment";
      import { MongoDataProvider } from "remult/remult-mongo";
      import { getUserFromRequest } from "../demo/auth/server/auth";
      import { auth } from "../demo/auth/server/index";
        
      export const api = remultApi({
        dataProvider: building ? undefined : async () => {
          const client = new MongoClient(MONGO_URL!)
          await client.connect()
          return new MongoDataProvider(client.db(MONGO_DB), client)
        },
        getUser: getUserFromRequest,
        modules: [auth()],
      });"
    `);
  });
  test("with auth", () => {
    expect(
      buildApiFile(
        DATABASES.json,
        Servers.express,
        Auths["better-auth"],
        false,
        false,
      ),
    ).toMatchInlineSnapshot(`
        "import { remultApi } from "remult/remult-express";
        import { getUserFromRequest } from "../demo/auth/server/auth.js";
        import { auth } from "../demo/auth/server/index.js";
          
        export const api = remultApi({
          getUser: getUserFromRequest,
          modules: [auth()],
        });"
      `);
  });
});

describe("test vite config", async () => {
  test("test vue with plugin", () => {
    expect(
      createViteConfig({
        framework: "vue",
        authInfo: Auths["better-auth"],
        withPlugin: true,
      }),
    ).toMatchInlineSnapshot(`
      "import { defineConfig } from "vite";
      import vue from "@vitejs/plugin-vue";
      import express from 'vite3-plugin-express';

      // https://vitejs.dev/config/
      export default defineConfig({
        plugins: [vue(), express("src/server")],
        esbuild: {
          tsconfigRaw: {
            compilerOptions: {
              experimentalDecorators: true,
            },
          },
        },
      });"
    `);
  });
  test("test vie without plugin", () => {
    expect(
      createViteConfig({
        framework: "vue",
        authInfo: Auths["better-auth"],
        withPlugin: false,
      }),
    ).toMatchInlineSnapshot(`
      "import { defineConfig } from "vite";
      import vue from "@vitejs/plugin-vue";

      // https://vitejs.dev/config/
      export default defineConfig({
        plugins: [vue()],
        esbuild: {
          tsconfigRaw: {
            compilerOptions: {
              experimentalDecorators: true,
            },
          },
        },
        server: {
          proxy: {
            "/api": "http://localhost:3002",
            "/auth": {
              target: "http://localhost:3002",
              changeOrigin: false,
            },
          },
        },
      });"
    `);
  });
  test("test vue without plugin and auth", () => {
    expect(
      createViteConfig({
        framework: "vue",
        authInfo: null,
        withPlugin: false,
      }),
    ).toMatchInlineSnapshot(`
      "import { defineConfig } from "vite";
      import vue from "@vitejs/plugin-vue";

      // https://vitejs.dev/config/
      export default defineConfig({
        plugins: [vue()],
        esbuild: {
          tsconfigRaw: {
            compilerOptions: {
              experimentalDecorators: true,
            },
          },
        },
        server: {
          proxy: {
            "/api": "http://localhost:3002",
          },
        },
      });"
    `);
  });
});

describe.sequential("test-write-react stuff", async () => {
  const sourceDir = path.join("tmp", "src");
  const nextAppDir = path.join(sourceDir, "app");
  const basicArgs: WriteFilesArgs = {
    admin: false,
    copyDir: (_: string, _1: string) => {},
    crud: true,
    db: DATABASES.json,
    framework: react,
    projectName: "haha",
    root: "tmp",
    server: Servers.express,
    templatesDir: "templates",
    authInfo: Auths["better-auth"],
    distLocation: "dist",
    envVariables: [],
  };

  test.sequential("react is ok", async () => {
    if (!fs.existsSync(sourceDir)) fs.mkdirSync(sourceDir, { recursive: true });
    writeAppTsxAndReadme(basicArgs);
    expect(fs.readFileSync(path.join(sourceDir, "App.tsx")).toString())
      .toMatchInlineSnapshot(`
        "import Tile from "./demo/Tile";
        import ServerStatus from "./demo/ServerStatus";
        import Auth from "./demo/auth/Auth";
        import Todo from "./demo/todo/Todo";

        export default function App() {
          return (
            <div className="tiles">
              <Tile
                title="haha"
                subtitle=""
                icon="remult"
                className="intro"
                status="Success"
                width="half"
              >
                <div className="tile__title">What's next?</div>
                <div className="button-row">
                  <a
                    className="button"
                    href="https://learn.remult.dev/"
                    target="_blank"
                  >
                    Interactive Tutorial
                  </a>
                  <a className="button" href="https://remult.dev/docs" target="_blank">
                    Documentation
                  </a>
                  <a
                    className="button"
                    href="https://github.com/remult/remult"
                    target="_blank"
                  >
                    Github
                  </a>
                </div>
                <div className="intro__stack">
                  <div className="intro__stack-item">
                    <span>Framework</span>
                    React
                  </div>
                  <div className="intro__stack-item">
                    <span>Bundler</span>
                    Vite
                  </div>
                  <div className="intro__stack-item">
                    <span>Server</span>
                    Express
                  </div>
                  <div className="intro__stack-item">
                    <span>Database</span>
                    JSON Files
                  </div>
                  <div className="intro__stack-item">
                    <span>Auth</span>
                    auth.js
                  </div>
                </div>
              </Tile>
              <ServerStatus />
              <Auth />
              <Todo />
            </div>
          );
        }
        "
      `);
  });
  test.sequential("next is ok", async () => {
    if (!fs.existsSync(nextAppDir))
      fs.mkdirSync(nextAppDir, { recursive: true });
    writeAppTsxAndReadme({
      ...basicArgs,
      framework: nextJs,
      server: nextJs.serverInfo!,
    });
    expect(fs.readFileSync(path.join(nextAppDir, "page.tsx")).toString())
      .toMatchInlineSnapshot(`
        ""use client"
        import Tile from "../demo/Tile";
        import Auth from "../demo/auth/Auth";
        import Todo from "../demo/todo/Todo";

        export default function Home() {
          return (
            <div className="tiles">
              <Tile
                title="haha"
                subtitle=""
                icon="remult"
                className="intro"
                status="Success"
                width="half"
              >
                <div className="tile__title">What's next?</div>
                <div className="button-row">
                  <a
                    className="button"
                    href="https://learn.remult.dev/"
                    target="_blank"
                  >
                    Interactive Tutorial
                  </a>
                  <a className="button" href="https://remult.dev/docs" target="_blank">
                    Documentation
                  </a>
                  <a
                    className="button"
                    href="https://github.com/remult/remult"
                    target="_blank"
                  >
                    Github
                  </a>
                </div>
                <div className="intro__stack">
                  <div className="intro__stack-item">
                    <span>Framework</span>
                    Next.js
                  </div>
                  <div className="intro__stack-item">
                    <span>Database</span>
                    JSON Files
                  </div>
                  <div className="intro__stack-item">
                    <span>Auth</span>
                    auth.js
                  </div>
                </div>
              </Tile>
              <Auth />
              <Todo />
            </div>
          );
        }
        "
      `);
  });
  test.sequential("remove .js", () => {
    expect(
      removeJs(`import type { ProviderType } from "./server/auth.js";
import { Roles } from "./Roles.js";`),
    ).toMatchInlineSnapshot(`
      "import type { ProviderType } from "./server/auth";
      import { Roles } from "./Roles";"
    `);
  });
  test.sequential("nuxt", async () => {
    const nuxtAppDir = path.join("tmp", "server", "api");
    if (!fs.existsSync(nuxtAppDir))
      fs.mkdirSync(nuxtAppDir, { recursive: true });
    const apiPath = path.join(nuxtAppDir, "[...remult].ts");
    var nuxt = FRAMEWORKS.find((x) => x.name === "nuxt")!.serverInfo!;
    fs.writeFileSync(
      apiPath,
      buildApiFile(DATABASES.json, nuxt, Auths["better-auth"], true, true),
    );
    nuxt.writeFiles!({
      ...basicArgs,
    });
    expect(fs.readFileSync(apiPath).toString()).toMatchInlineSnapshot(`
      "import { remultApi } from "remult/remult-nuxt";
      import { Task } from "../../demo/todo/Task.js";
        
      export const api = remultApi({
        admin: true,
        entities: [Task],
      });

      export default defineEventHandler(api);"
    `);
  });
});

async function run(what: string, args: string[], where?: string) {
  return new Promise<number>((res, rej) => {
    const child = spawn(what, args, {
      //  stdio: "inherit",
      cwd: where,
    });

    child.on("exit", (code) => {
      if (code != 0) rej({ what, args, where });
      res(code!);
    });
  });
}
if (false)
  describe.skip("test it builds ", async () => {
    test.only("test auth next with mssql", async () => {
      await testItBuildsAndRuns({
        template: "nextjs",
        database: "mssql",
        auth: true,
        checkStart: false,
      });
    });
    for (const database in DATABASES) {
      for (const fw of FRAMEWORKS) {
        if (Object.prototype.hasOwnProperty.call(DATABASES, database)) {
          if (!fw.serverInfo) {
            for (const server in Servers) {
              if (
                server !== vite_express_key ||
                fw.canWorkWithVitePluginExpress
              ) {
                test.sequential(
                  "test " + fw.name + " db " + database + " server " + server,
                  async () => {
                    await testItBuildsAndRuns({
                      template: fw.name,
                      database: database,
                      server,
                    });
                  },
                );
                if (
                  (Servers[server as keyof typeof Servers] as ServerInfo)
                    .authImplementedReason === undefined
                ) {
                  test.sequential(
                    "test " +
                      fw.name +
                      " db " +
                      database +
                      " server " +
                      server +
                      " with auth",
                    async () => {
                      const dir = await testItBuildsAndRuns({
                        template: fw.name,
                        database: database,
                        server,
                        auth: true,
                        checkStart: false,
                      });
                      if ((server as keyof typeof Servers) === "express")
                        expect(
                          fs.existsSync(
                            path.join(dir!, "src", "server", "auth.ts"),
                          ),
                        ).toBe(true);
                    },
                  );
                }
              }
            }
          } else
            test.sequential("test " + fw.name + " db " + database, async () => {
              await testItBuildsAndRuns({
                template: fw.name,
                database: database,
              });
            });
          if (fw.serverInfo?.authImplementedReason === undefined) {
            test.sequential(
              "test " + fw.name + " db " + database + " with auth",
              async () => {
                await testItBuildsAndRuns({
                  template: fw.name,
                  database: database,
                  auth: true,
                  checkStart: false,
                });
              },
            );
          }
        }
      }
    }

    async function testItBuildsAndRuns({
      template,
      database,
      port,
      checkStart,
      server,
      auth,
    }: {
      template: string;
      database?: string;
      auth?: boolean;
      server?: string;
      port?: number;
      checkStart?: boolean;
    }) {
      if (!database) database = "json";
      let name = template + "-" + database;
      if (server) name += "-" + server;
      if (auth) name += "-auth";
      const dir = "tmp/" + name;

      emptyDir(dir);
      expect(
        await run(
          "npx",
          [
            "create-remult",
            name,
            "--template=" + template,
            "--database=" + database,
            server ? "--server=" + server : "",
            auth ? "--auth=auth.js" : "",
          ],
          "tmp",
        ),
        "create remult",
      ).toBe(0);
      expect(await run("npm", ["install"], dir), "npm install").toBe(0);
      expect(await run("npm", ["run", "build"], dir), "npm build").toBe(0);
      if (checkStart && false) {
        var process = spawn("npm", ["start"], { cwd: dir });
        try {
          let result: Response = undefined!;
          for (let index = 0; index < 5; index++) {
            try {
              result = await fetch("http://127.0.0.1:" + port);
              if (result.status == 200) return;
            } catch (error) {
              await setTimeout(1000);
              console.log("waiting for server to start");
            }
          }
          expect(result?.status).toBe(200);
        } finally {
          process.kill();
        }
      }
      return dir;
    }
  });
