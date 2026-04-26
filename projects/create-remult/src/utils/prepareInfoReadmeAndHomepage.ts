import type { WriteFilesArgs } from "../FRAMEWORKS";
import path from "path";
import type { Import } from "./writeImports";

export function prepareInfoReadmeAndHomepage(
  args: WriteFilesArgs & { frontendTemplate: string },
) {
  let {
    authInfo,
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

  let components: ComponentInfo[] = [
    {
      ...framework,
      type: "Framework",
      description: "Your favorite framework/library",
      emoji: "🌟",
    },
  ];
  if (framework.canWorkWithVitePluginExpress) {
    components.push({
      display: "Vite",
      url: "https://vitejs.dev/",
      type: "Bundler",
      description: "Powering modern web applications",
      emoji: "🔥",
    });
  }
  if (server.componentInfo) components.push(server.componentInfo);
  components.push({ ...db, type: "Database" });

  const uiNames: string[] = ["Tile"];
  const imports: Import[] = [
    {
      from: "./modules/ui",
      imports: uiNames,
    },
  ];
  const li: (() => string)[] = [];

  if (server.requiresTwoTerminal) {
    copyDir(
      path.join(templatesDir, "check-server", frontendTemplate),
      path.join(root),
    );
    imports.push({
      from: "./modules/server-status/ServerStatus" + (framework.componentFileSuffix ?? ""),
      imports: "ServerStatus",
    });
    li.push(() => "<ServerStatus />");
  }
  if (authInfo) {
    copyDir(
      path.join(templatesDir, "auth", authInfo.name, frontendTemplate),
      path.join(root),
    );

    components.push({
      ...authInfo.componentInfo,
      type: "Auth",
    });
    imports.push({
      from: "./modules/auth",
      imports: ["Auth"],
    });
    li.push(() => "<Auth />");
  }
  if (admin) {
    copyDir(
      path.join(templatesDir, "admin", frontendTemplate),
      path.join(root),
    );
    uiNames.push("Admin");
    li.push(() => `<Admin />`);
  }
  if (crud) {
    copyDir(path.join(templatesDir, "crud", frontendTemplate), path.join(root));
    imports.push({
      from: "./modules/todo/Todo" + (framework.componentFileSuffix ?? ""),
      imports: "Todo",
    });
    li.push(() => "<Todo />");
  }
  if (server.doesNotLikeJsFileSuffix) {
    for (const i of imports) {
      if (i.from.startsWith("./modules/")) i.from = "." + i.from;
    }
  }
  return { components, imports, li };
}

export type ComponentInfo = {
  display: string;
  url: string;
  type?: string;
  description: string;
  emoji: string;
};
