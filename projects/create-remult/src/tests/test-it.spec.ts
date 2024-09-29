import { expect, test, describe } from "vitest";
import spawn, { sync } from "cross-spawn";
import fs from "fs";
import { emptyDir } from "../empty-dir";
import { setTimeout } from "timers/promises";
import {
  FRAMEWORKS,
  Servers,
  vite_express_key,
  type ServerInfo,
  type WriteFilesArgs,
} from "../FRAMEWORKS";
import { createViteConfig } from "../createViteConfig";
import { DATABASES } from "../DATABASES";
import { buildApiFile } from "../buildApiFile";
import path from "path";
import { react, writeAppTsxAndReadme } from "../frameworks/react";
import { beforeEach } from "node:test";
import { nextJs, removeJs } from "../frameworks/nextjs";
import { adjustEnvVariablesForSveltekit } from "../frameworks/sveltekit";

describe("api file variations", async () => {
  test("basic", () => {
    expect(buildApiFile(DATABASES.json, Servers.express, false, false, false))
      .toMatchInlineSnapshot(`
        "import { remultExpress } from "remult/remult-express";
          
        export const api = remultExpress({});"
      `);
  });
  test("with db", () => {
    expect(
      buildApiFile(DATABASES.postgres, Servers.express, false, false, false),
    ).toMatchInlineSnapshot(`
      "import { remultExpress } from "remult/remult-express";
      import { createPostgresDataProvider } from "remult/postgres";
        
      export const api = remultExpress({
        dataProvider: createPostgresDataProvider({
          connectionString: process.env["DATABASE_URL"]    
        }),
      });"
    `);
  });
  test("with db and auth", () => {
    expect(
      buildApiFile(DATABASES.postgres, Servers.express, true, false, false),
    ).toMatchInlineSnapshot(`
      "import { remultExpress } from "remult/remult-express";
      import { createPostgresDataProvider } from "remult/postgres";
      import { getUserFromRequest } from "./auth.js";
      import { User } from "../demo/auth/User.js";
        
      export const api = remultExpress({
        getUser: getUserFromRequest,
        initApi: async () => {
          await User.createDemoUsers();
        },
        dataProvider: createPostgresDataProvider({
          connectionString: process.env["DATABASE_URL"]    
        }),
        entities: [User],
      });"
    `);
  });
  test("with db and auth svelteKit", () => {
    expect(
      adjustEnvVariablesForSveltekit(
        buildApiFile(
          DATABASES.mssql,
          FRAMEWORKS.find((x) => x.name === "sveltekit")?.serverInfo!,
          true,
          false,
          false,
        ),
      ),
    ).toMatchInlineSnapshot(`
      "import { remultSveltekit } from "remult/remult-sveltekit";
      import { createKnexDataProvider } from "remult/remult-knex";
      import { MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD, MSSQL_INSTANCE } from "$env/static/private";
      import { building } from "$app/environment";
      import { getUserFromRequest } from "./auth";
      import { User } from "../demo/auth/User";
        
      export const api = remultSveltekit({
        getUser: getUserFromRequest,
        initApi: async () => {
          await User.createDemoUsers();
        },
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
        entities: [User],
      });"
    `);
  });
  test("with db and auth svelteKit", () => {
    expect(
      adjustEnvVariablesForSveltekit(
        buildApiFile(
          DATABASES.mongodb,
          FRAMEWORKS.find((x) => x.name === "sveltekit")?.serverInfo!,
          true,
          false,
          false,
        ),
      ),
    ).toMatchInlineSnapshot(`
      "import { remultSveltekit } from "remult/remult-sveltekit";
      import { MongoClient } from "mongodb";
      import { MONGO_URL, MONGO_DB } from "$env/static/private";
      import { building } from "$app/environment";
      import { MongoDataProvider } from "remult/remult-mongo";
      import { getUserFromRequest } from "./auth";
      import { User } from "../demo/auth/User";
        
      export const api = remultSveltekit({
        getUser: getUserFromRequest,
        initApi: async () => {
          await User.createDemoUsers();
        },
        dataProvider: building ? undefined : async () => {
          const client = new MongoClient(MONGO_URL!)
          await client.connect()
          return new MongoDataProvider(client.db(MONGO_DB), client)
        },
        entities: [User],
      });"
    `);
  });
  test("with auth", () => {
    expect(buildApiFile(DATABASES.json, Servers.express, true, false, false))
      .toMatchInlineSnapshot(`
        "import { remultExpress } from "remult/remult-express";
        import { getUserFromRequest } from "./auth.js";
        import { User } from "../demo/auth/User.js";
          
        export const api = remultExpress({
          getUser: getUserFromRequest,
          initApi: async () => {
            await User.createDemoUsers();
          },
          entities: [User],
        });"
      `);
  });
});

describe("test vite config", async () => {
  test("test vue with plugin", () => {
    expect(
      createViteConfig({
        framework: "vue",
        withAuth: true,
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
        withAuth: true,
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
        withAuth: false,
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
    withAuth: true,
    distLocation: "dist",
  };

  test.sequential("react is ok", async () => {
    if (!fs.existsSync(sourceDir)) fs.mkdirSync(sourceDir, { recursive: true });
    writeAppTsxAndReadme(basicArgs);
    expect(fs.readFileSync(path.join(sourceDir, "App.tsx")).toString())
      .toMatchInlineSnapshot(`
        "import CheckServer from "./demo/CheckServer";
        import CheckAuth from "./demo/auth/CheckAuth";
        import Todo from "./demo/todo/Todo";

        export default function App() {
          return (
            <>
              Welcome to haha
              <ul>
                <li>React, Vite, Express, JSON, auth.js, remult</li>
                <li><CheckServer/></li>
                <li><CheckAuth/></li>
                <li><Todo/></li>
              </ul>
            </>
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
        import CheckAuth from "../demo/auth/CheckAuth";
        import Todo from "../demo/todo/Todo";

        export default function Home() {
          return (
            <>
              Welcome to haha
              <ul>
                <li>Next.js, JSON, auth.js, remult</li>
                <li><CheckAuth/></li>
                <li><Todo/></li>
              </ul>
            </>
          );
        }
        "
      `);
  });
  test.sequential("remove .js", () => {
    expect(
      removeJs(`import type { ProviderType } from "../../server/auth.js";
import { Roles } from "./Roles.js";`),
    ).toMatchInlineSnapshot(`
      "import type { ProviderType } from "../../server/auth";
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
      buildApiFile(DATABASES.json, nuxt, false, true, true),
    );
    nuxt.writeFiles!({
      ...basicArgs,
    });
    expect(fs.readFileSync(apiPath).toString()).toMatchInlineSnapshot(`
      "import { remultNuxt } from "remult/remult-nuxt";
      import { Task } from "../../demo/todo/Task.js";
        
      export const api = remultNuxt({
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
      const dir = await testItBuildsAndRuns({
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
                  (Servers[server as keyof typeof Servers] as ServerInfo).auth
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
          if (fw.serverInfo?.auth) {
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
