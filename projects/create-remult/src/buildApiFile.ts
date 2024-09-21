import type { DatabaseType } from "./DATABASES";
import type { ServerInfo } from "./FRAMEWORKS";

export function buildApiFile(
  db: DatabaseType,
  server: ServerInfo,
  auth: boolean,
) {
  let imports: DatabaseType["imports"] = [];
  if (db.imports) {
    imports = imports.concat(db.imports);
  }

  imports.unshift({
    from: "remult/" + server.import,
    imports: [server.remultServerFunction],
  });
  if (auth) {
    imports.push({
      from: "./auth" + (server.doesNotLikeJsFileSuffix ? "" : ".js"),
      imports: ["getUserFromRequest"],
    });
  }
  let serverArguments: string[] = [];
  if (db.code) {
    serverArguments.push(`dataProvider: ${db.code}`);
  }
  if (auth) {
    serverArguments.push(`getUser: getUserFromRequest`);
  }

  let api = `export const api = ${server.remultServerFunction}({${
    serverArguments.length > 0
      ? "\n  " +
        serverArguments
          .map((arg) => arg.split("\n").join("\n  "))
          .join(",\n  ") +
        ",\n"
      : ""
  }});`;

  const apiContent =
    imports
      .map(({ from, imports, defaultImport }) =>
        defaultImport
          ? `import ${imports[0]} from "${from}";`
          : `import { ${imports.join(", ")} } from "${from}";`,
      )
      .join("\n") +
    "\n\n" +
    api;
  return apiContent;
}
