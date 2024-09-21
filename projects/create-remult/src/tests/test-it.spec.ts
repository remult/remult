import { expect, test, describe } from "vitest";
import spawn, { sync } from "cross-spawn";
import { emptyDir } from "../empty-dir";
import { setTimeout } from "timers/promises";
import { FRAMEWORKS, Servers } from "../FRAMEWORKS";
import { DATABASES } from "../DATABASES";
import { buildApiFile } from "../buildApiFile";

describe.sequential("api file variations", async () => {
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

async function run(what: string, args: string[], where?: string) {
  return new Promise<number>((res, rej) => {
    const child = spawn(what, args, {
      stdio: "inherit",
      cwd: where,
    });

    child.on("exit", (code) => {
      if (code != 0) rej({ what, args });
      res(code!);
    });
  });
}
if (false)
  for (const fw of FRAMEWORKS) {
    for (const key in DATABASES) {
      if (Object.prototype.hasOwnProperty.call(DATABASES, key)) {
        if (!fw.serverInfo) {
          for (const server in Servers) {
            test.sequential(
              "test " + fw.name + " db " + key + " server " + server,
              async () => {
                await testItBuildsAndRuns({
                  template: fw.name,
                  database: key,
                  server,
                });
              },
            );
          }
        } else
          test.sequential("test " + fw.name + " db " + key, async () => {
            await testItBuildsAndRuns({
              template: fw.name,
              database: key,
            });
          });
      }
    }
  }

// test.only('react', async () => {
//   await testItBuildsAndRuns({
//     template: 'react',

//     port: 3002,
//     checkStart: true,
//   })
// })
// test('vue', async () => {
//   await testItBuildsAndRuns({
//     template: 'vue',
//     port: 3002,
//     checkStart: true,
//   })
// })
// test('angular', async () => {
//   await testItBuildsAndRuns({
//     template: 'angular',
//     port: 3002,
//     checkStart: true,
//   })
// })
// test.only('netxjs', async () => {
//   await testItBuildsAndRuns({
//     template: 'nextjs',
//     port: 3000,
//     checkStart: true,
//   })
// })

// test('sveltekit', async () => {
//   await testItBuildsAndRuns({
//     template: 'sveltekit',
//     port: 3000,
//     checkStart: false,
//   })
// })

async function testItBuildsAndRuns({
  template,
  database,
  port,
  checkStart,
  server,
}: {
  template: string;
  database?: string;
  server?: string;
  port?: number;
  checkStart?: boolean;
}) {
  if (!database) database = "json";
  let name = template + "-" + database;
  if (server) name += "-" + server;
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
