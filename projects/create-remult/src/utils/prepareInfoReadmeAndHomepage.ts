import type { WriteFilesArgs } from "../FRAMEWORKS";
import path from "path";
import type { Import } from "./writeImports";

export function prepareInfoReadmeAndHomepage(
  args: WriteFilesArgs & { frontendTemplate: string },
) {
  let {
    withAuth,
    root,
    server,
    templatesDir,
    copyDir,
    crud,
    framework,
    db,
    admin,
    frontendTemplate,
  } = args;

  let components: ComponentInfo[] = [framework];
  if (framework.canWorkWithVitePluginExpress) {
    components.push({ display: "Vite", url: "https://vitejs.dev/" });
    if (server.componentInfo) components.push(server.componentInfo);
  }
  components.push(db);

  const imports: Import[] = [];
  const li: (() => string)[] = [
    () =>
      components
        .map(({ display, url }) => `<a href="${url}">${display}</a>`)
        .join(", "),
  ];

  if (server.requiresTwoTerminal) {
    copyDir(
      path.join(templatesDir, "check-server", frontendTemplate),
      path.join(root),
    );
    imports.push({
      from: "./demo/CheckServer" + (framework.componentFileSuffix ?? ""),
      imports: "CheckServer",
    });
    li.push(() => "<CheckServer />");
  }
  if (withAuth) {
    copyDir(path.join(templatesDir, "auth", frontendTemplate), path.join(root));

    components.push({ display: "auth.js", url: "https://authjs.dev" });
    imports.push({
      from: "./demo/auth/CheckAuth" + (framework.componentFileSuffix ?? ""),
      imports: "CheckAuth",
    });
    li.push(() => "<CheckAuth />");
  }
  if (admin) li.push(() => `Admin: <a href="/api/admin">Admin</a>`);
  if (crud) {
    copyDir(path.join(templatesDir, "crud", frontendTemplate), path.join(root));
    imports.push({
      from: "./demo/todo/Todo" + (framework.componentFileSuffix ?? ""),
      imports: "Todo",
    });
    li.push(() => "<Todo />");
  }
  components.push({ display: "remult", url: "https://remult.dev" });
  if (server.doesNotLikeJsFileSuffix) {
    for (const i of imports) {
      if (i.from.startsWith("./demo")) i.from = "." + i.from;
    }
  }
  return { components, imports, li };
}

export type ComponentInfo = { display: string; url: string };
