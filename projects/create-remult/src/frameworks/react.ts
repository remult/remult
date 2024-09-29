import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { createViteConfig } from "../createViteConfig";
import { writeImports, type Import } from "../writeImports";

export const react: Framework = {
  name: "react",
  display: "React",
  canWorkWithVitePluginExpress: true,
  writeFiles: ({
    withAuth,
    root,
    server,
    templatesDir,
    copyDir,
    crud,
    framework,
    db,
    admin,
    projectName,
  }) => {
    fs.writeFileSync(
      path.join(root, "vite.config.ts"),
      createViteConfig({
        framework: "react",
        withAuth,
        withPlugin: false,
      }),
    );
    let components: string[] = [framework.name, "Vite"];
    if (server.display) components.push(server.display);
    components.push(db.display);

    const imports: Import[] = [];
    const li: (() => string)[] = [() => components.join(", ")];

    if (server.requiresTwoTerminal) {
      copyDir(
        path.join(templatesDir, "check-server", "react"),
        path.join(root),
      );
      imports.push({
        from: "./demo/CheckServer",
        imports: "CheckServer",
      });
      li.push(() => "<CheckServer/>");
    }
    if (withAuth) {
      copyDir(path.join(templatesDir, "auth", "react"), path.join(root));
      components.push("auth.js");
      imports.push({
        from: "./demo/auth/CheckAuth",
        imports: "CheckAuth",
      });
      li.push(() => "<CheckAuth/>");
    }
    if (admin) li.push(() => `Admin: <a href="/api/admin">Admin</a>`);
    if (crud) {
      copyDir(path.join(templatesDir, "crud", "react"), path.join(root));
      imports.push({
        from: "./demo/todo/TodoComponent",
        imports: "Todo",
      });
      li.push(() => "<Todo/>");
    }
    components.push("remult");
    fs.writeFileSync(
      path.join(root, "src", "App.tsx"),
      `${writeImports(imports)}
function App() {
  return (
    <>
      Welcome to ${projectName}
      <ul>
        ${li.map((l) => `<li>${l()}</li>`).join("\n        ")}
      </ul>
    </>
  );
}
export default App;
`,
    );
  },
};
