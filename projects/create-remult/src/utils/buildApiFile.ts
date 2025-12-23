import { AuthInfo } from "../AUTH.js";
import type { DatabaseType } from "../DATABASES";
import type { ServerInfo } from "../FRAMEWORKS";
import { writeImports } from "./writeImports";

export function buildApiFile(
  db: DatabaseType,
  server: ServerInfo,
  auth: AuthInfo | undefined | null,
  admin: boolean,
  crud: boolean,
) {
  let imports: DatabaseType["imports"] = [];
  if (db.imports) {
    imports = imports.concat(db.imports);
  }

  let entities: string[] = [];
  imports.unshift({
    from: "remult/" + server.import,
    imports: [server.remultServerFunction],
  });
  if (crud) {
    entities.push("Task");
    imports.push({
      from: "../demo/todo/Task.js",
      imports: ["Task"],
    });
  }
  let serverArguments: string[] = [];
  if (db.code) {
    serverArguments.push(`dataProvider: ${db.code}`);
  }
  if (admin) {
    serverArguments.push(`admin: true`);
  }
  if (entities.length > 0) {
    serverArguments.push(`entities: [${entities.join(", ")}]`);
  }
  if (auth) {
    auth.apiFiles?.imports.forEach((i) => {
      imports.push(i);
    });
    auth.apiFiles?.serverArguments.forEach((a) => {
      serverArguments.push(a);
    });
  }

  let api = `
  
export const api = ${server.remultServerFunction}({${
    serverArguments.length > 0
      ? "\n  " +
        serverArguments
          .map((arg) => arg.split("\n").join("\n  "))
          .join(",\n  ") +
        ",\n"
      : ""
  }});`;

  const apiContent = writeImports(imports, server) + api;
  return apiContent;
}
