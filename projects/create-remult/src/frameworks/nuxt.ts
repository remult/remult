import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { prepareInfoReadmeAndHomepage } from "../utils/prepareInfoReadmeAndHomepage";
import { createReadmeFile } from "../utils/createReadmeFile";
import { writeAppVue } from "./vue";

export const nuxt: Framework = {
  name: "nuxt",
  display: "Nuxt",
  url: "https://nuxt.com/",

  serverInfo: {
    remultServerFunction: "remultNuxt",
    import: "remult-nuxt",
    path: "server/api/[...remult].ts",
    writeFiles: (args) => {
      const apiPath = path.join(args.root, "server/api/[...remult].ts");
      fs.writeFileSync(
        apiPath,
        fs
          .readFileSync(apiPath)
          .toString()
          .replace(/"\.\.\/demo/g, '"../../demo') +
          "\n\nexport default defineEventHandler(api);",
      );
      var info = prepareInfoReadmeAndHomepage({
        ...args,
        frontendTemplate: "vue",
      });
      writeAppVue(path.join(args.root, "src", "App.vue"), info, args);

      createReadmeFile(
        args.projectName,
        info.components,
        args.server,
        args.root,
        args.envVariables,
      );

      args.copyDir(path.join(path.join(args.root, "src")), args.root);
      fs.rmSync(path.join(args.root, "src"), { recursive: true, force: true });
    },
  },
};
