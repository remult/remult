import { expect, test, describe } from "vitest";
import spawn, { sync } from "cross-spawn";
import { emptyDir } from "../empty-dir";
import { setTimeout } from "timers/promises";
import {
  adjustEnvVariablesForSveltekit,
  createViteConfig,
  FRAMEWORKS,
  Servers,
  vite_express_key,
  type ServerInfo,
} from "../FRAMEWORKS";
import { DATABASES } from "../DATABASES";
import { buildApiFile } from "../buildApiFile";

describe("api file variations", async () => {
  test("basic", () => {
    expect(buildApiFile(DATABASES.json, Servers.express, false))
      .toMatchInlineSnapshot(`
        "import { remultExpress } from "remult/remult-express";

        export const api = remultExpress({});"
      `);
  });
  test("with db", () => {
    expect(buildApiFile(DATABASES.postgres, Servers.express, false))
      .toMatchInlineSnapshot(`
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
    expect(buildApiFile(DATABASES.postgres, Servers.express, true))
      .toMatchInlineSnapshot(`
        "import { remultExpress } from "remult/remult-express";
        import { createPostgresDataProvider } from "remult/postgres";
        import { getUserFromRequest } from "./auth.js";

        export const api = remultExpress({
          dataProvider: createPostgresDataProvider({
            connectionString: process.env["DATABASE_URL"]    
          }),
          getUser: getUserFromRequest,
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
        ),
      ),
    ).toMatchInlineSnapshot(`
      "import { remultSveltekit } from "remult/remult-sveltekit";
      import { createKnexDataProvider } from "remult/remult-knex";
      import { MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, MSSQL_PASSWORD, MSSQL_INSTANCE } from "$env/static/private";
      import { getUserFromRequest } from "./auth";

      export const api = remultSveltekit({
        dataProvider: createKnexDataProvider({
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
      });"
    `);
  });
  test("with auth", () => {
    expect(buildApiFile(DATABASES.json, Servers.express, true))
      .toMatchInlineSnapshot(`
        "import { remultExpress } from "remult/remult-express";
        import { getUserFromRequest } from "./auth.js";

        export const api = remultExpress({
          getUser: getUserFromRequest,
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
        server: {
          proxy: {
            "/api": "http://localhost:3002",
            "/auth": "http://localhost:3002",
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
        server: {
          proxy: {
            "/api": "http://localhost:3002",
          },
        },
      });"
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
      if (code != 0) rej({ what, args });
      res(code!);
    });
  });
}
describe("test it builds ", async () => {
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
                    await testItBuildsAndRuns({
                      template: fw.name,
                      database: database,
                      server,
                      auth: true,
                      checkStart: false,
                    });
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
          auth ? "--auth=next.js" : "",
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
  }
});
