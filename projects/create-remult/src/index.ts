import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import minimist from "minimist";
import prompts from "prompts";
import { gray, red, reset } from "@kitql/helpers";
import { emptyDir } from "./utils/empty-dir";
import {
  FRAMEWORKS,
  Servers,
  vite_express_key,
  type envVariable,
  type Framework,
  type ServerInfo,
} from "./FRAMEWORKS";
import { DATABASES, databaseTypes, type DatabaseType } from "./DATABASES";
import { buildApiFile } from "./utils/buildApiFile";
import { extractEnvironmentVariables } from "./utils/extractEnvironmentVariables";
import { removeJs } from "./frameworks/nextjs";
import { svelteKit } from "./frameworks/sveltekit";
import { type AuthInfo, Auths } from "./AUTH.js";

const argv = minimist<{
  template?: string;
  help?: boolean;
}>(process.argv.slice(2), {
  default: { help: false },
  alias: { h: "help", t: "template" },
  string: ["_"],
});
const cwd = process.cwd();

// prettier-ignore
const helpMessage = `\
Usage: create-remult [OPTION]... [DIRECTORY]

Create a new Remult TypeScript project.
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template
  -d, --database NAME        use a specific database
  -s, --server NAME          use a specific server
  -a, --auth auth.js         use auth.js for authentication
  --admin                    add admin page
  --crud                     add crud demo

Available templates:
${FRAMEWORKS.map((f) => `  ${f.name}`).join('\n')}

Available databases:
${databaseTypes.map(x=>'  '+x).join('\n')}

Available servers:
${Object.keys(Servers).map(x=>'  '+x).join('\n')}
`

const renameFiles: Record<string, string | undefined> = {
  _gitignore: ".gitignore",
};

const defaultTargetDir = "remult-project";

async function init() {
  const argTargetDir = formatTargetDir(argv._[0]);
  const argTemplate = argv.template || argv.t;
  const argDatabase = argv.database || argv.d;
  const argServer = argv.server || argv.s;
  const argAuth = argv.auth || argv.a;
  const crudArg = argv.crud;
  const adminArg = argv.admin;

  const help = argv.help;
  if (help) {
    console.log(helpMessage);
    return;
  }

  let targetDir = argTargetDir || defaultTargetDir;
  const getProjectName = () =>
    targetDir === "." ? path.basename(path.resolve()) : targetDir;

  let result: prompts.Answers<
    | "projectName"
    | "overwrite"
    | "packageName"
    | "framework"
    | "server"
    | "database"
    | "auth"
    | "admin"
    | "crud"
  >;

  prompts.override({
    overwrite: argv.overwrite,
    framework: FRAMEWORKS.find((x) => x.name == argTemplate),
    server: Servers[argServer as keyof typeof Servers],
    auth: argAuth === undefined ? undefined : argAuth === "auth.js",
    crud: crudArg === undefined ? undefined : crudArg === true,
    admin: adminArg === undefined ? undefined : adminArg === true,
  });

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : "text",
          name: "projectName",
          message: reset("Project name:"),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir;
          },
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "select",
          name: "overwrite",
          message: () =>
            (targetDir === "."
              ? "Current directory"
              : `Target directory "${targetDir}"`) +
            ` is not empty. Please choose how to proceed:`,
          initial: 0,
          choices: [
            {
              title: "Remove existing files and continue",
              value: "yes",
            },
            {
              title: "Cancel operation",
              value: "no",
            },
            {
              title: "Ignore files and continue",
              value: "ignore",
            },
          ],
        },

        {
          type: (_, { overwrite }: { overwrite?: string }) => {
            if (overwrite === "no") {
              throw new Error(red("✖") + " Operation cancelled");
            }
            return null;
          },
          name: "overwriteChecker",
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : "text"),
          name: "packageName",
          message: reset("Package name:"),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || "Invalid package.json name",
        },
        {
          type:
            argTemplate && FRAMEWORKS.find((x) => x.name === argTemplate)
              ? null
              : "select",
          name: "framework",
          message:
            typeof argTemplate === "string" &&
            !FRAMEWORKS.find((x) => x.name === argTemplate)
              ? reset(
                  `"${argTemplate}" isn't a valid template. Please choose from below: `,
                )
              : reset("Select a framework:"),
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            return {
              title: reset(framework.display || framework.name),
              value: framework,
            };
          }),
        },

        {
          type: (_, { framework }: { framework: Framework }) =>
            framework &&
            !framework.serverInfo &&
            (!argServer || !Servers[argServer as keyof typeof Servers])
              ? "select"
              : null,
          name: "server",
          initial: 0,
          message: reset("Select a web server:"),

          choices: (framework: Framework) =>
            Object.keys(Servers)
              .filter(
                (x) =>
                  x !== vite_express_key ||
                  framework.canWorkWithVitePluginExpress,
              )
              .map((server) => ({
                title:
                  Servers[server as keyof typeof Servers].componentInfo
                    ?.display || server,
                value: Servers[server as keyof typeof Servers],
              })),
        },
        {
          type: (
            _,
            { framework, server }: { framework: Framework; server: ServerInfo },
          ) => {
            const result =
              (server?.authImplementedReason === undefined ||
                framework?.serverInfo?.authImplementedReason === undefined) &&
              (!argAuth || !Auths[argAuth as keyof typeof Auths]);
            return result ? "select" : null;
          },
          name: "auth",
          initial: 0,
          message: reset("Select auth:"),
          choices: () =>
            Object.keys(Auths).map((auth) => ({
              title:
                Auths[auth as keyof typeof Auths]?.componentInfo?.display ||
                "None",
              value: Auths[auth as keyof typeof Auths],
            })),
        },
        {
          type:
            argDatabase && databaseTypes.includes(argDatabase)
              ? null
              : "select",
          name: "database",
          message: reset("Select Database:"),
          initial: 0,
          validate: (dir) =>
            databaseTypes.includes(dir) || "Invalid database type",
          choices: databaseTypes.map((db) => {
            return {
              title:
                DATABASES[db].display +
                ((DATABASES[db] as any).extraText ?? ""),
              value: DATABASES[db],
            };
          }),
        },
        {
          type: "confirm",
          name: "crud",
          message: reset("Add CRUD demo (task)?"),
          initial: true,
        },
        {
          type: "confirm",
          name: "admin",
          message: reset("Enable `/api/admin` URL?"),
          initial: true,
        },
      ],

      {
        onCancel: () => {
          throw new Error(red("✖") + " Operation cancelled");
        },
      },
    );
  } catch (cancelled: any) {
    console.log(cancelled.message);
    return;
  }

  // user choice associated with prompts
  let {
    framework,
    overwrite,
    packageName,
    database,
    server,
    auth,
    crud,
    admin,
  } = result;

  const root = path.join(cwd, targetDir);

  if (overwrite === "yes") {
    emptyDir(root);
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }

  // determine template
  let template: string = framework?.name || argTemplate;

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : "npm";

  console.log(`\nScaffolding project in ${root}`);

  const templatesDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../..",
    `templates`,
  );

  const templateDir = path.join(templatesDir, template);

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file);
    if (content) {
      fs.writeFileSync(targetPath, content);
    } else {
      copy(path.join(templateDir, file), targetPath);
    }
  };

  const db: DatabaseType =
    database || DATABASES[argDatabase as keyof typeof DATABASES];
  const fw: Framework =
    framework || FRAMEWORKS.find((x) => x.name == template)!;
  const safeServer: ServerInfo =
    fw.serverInfo ||
    server ||
    Servers[argServer as keyof typeof Servers] ||
    Servers.express;

  const safeServerName = fw.serverInfo?.name || argServer || server?.name;
  const authInfo: AuthInfo | undefined =
    auth || Auths[argAuth as keyof typeof Auths] || Auths.none;

  const files = fs.readdirSync(templateDir);
  for (const file of files.filter((f) => !f.includes("node_modules"))) {
    write(file);
  }

  editJsonFile("package.json", (pkg) => {
    function sortObject(obj: Record<string, any>) {
      return Object.keys(obj)
        .sort()
        .reduce(
          (result, key) => {
            result[key] = obj[key];
            return result;
          },
          {} as Record<string, any>,
        );
    }
    pkg.name = packageName || getProjectName();
    pkg.dependencies = sortObject({
      ...pkg.dependencies,
      remult: "latest",
      // remult: "3.1.0-next.1",
      ...db.dependencies,
      ...safeServer.dependencies,
      ...authInfo?.dependencies?.(safeServerName),
    });
    pkg.devDependencies = sortObject({
      ...pkg.devDependencies,
      ...db.devDependencies,
      ...safeServer.devDependencies,
      ...authInfo?.devDependencies?.(safeServerName),
    });
    if (authInfo?.scripts) {
      pkg.scripts = {
        ...pkg.scripts,
        ...authInfo.scripts,
      };
    }
    if (fw === svelteKit) {
      pkg.devDependencies = sortObject({
        ...pkg.devDependencies,
        ...pkg.dependencies,
      });
      delete pkg.dependencies;
    }
  });
  const apiFileName = path.join(root, safeServer.path || "src/server/api.ts");
  const apiFileDir = path.dirname(apiFileName);
  if (!fs.existsSync(apiFileDir)) fs.mkdirSync(apiFileDir);
  fs.writeFileSync(
    apiFileName,
    buildApiFile(db, safeServer, authInfo, admin, crud),
  );
  let envVariables: envVariable[] = extractEnvironmentVariables(
    db.code ?? "",
  ).map((key) => ({ key }));
  if (envVariables.length > 0)
    envVariables[0].comment = "Database connection information";

  // Output the array of environment variables
  const envFile = fw.envFile || ".env";

  if (authInfo) {
    authInfo.envVariables?.forEach((env) => {
      envVariables.push(env);
    });
  }
  const envToShow = envVariables.filter((env) => !env.optional && !env.value);
  if (envToShow.length > 0) {
    console.log(
      `  Set the following environment variables in the '${envFile}' file:`,
    );
    envToShow.forEach((env) => {
      if (env.comment) {
        console.log(`    ${gray(`# ${env.comment}`)}`);
      }
      console.log(
        `    ${env.key}=${
          env.value
            ? `*****${" ".repeat(20 - env.key.length)}${gray(
                "# done by the cli",
              )}`
            : env.optional
            ? `${" ".repeat(25 - env.key.length)}${gray("# optional")}`
            : ""
        }`,
      );
    });
  }
  function buildEnv(withValue?: boolean) {
    return envVariables
      .map(
        (x) =>
          `${x.comment ? `# ${x.comment}\n` : ""}${x.key}=${
            withValue && x.value ? `${x.value || ""}` : ""
          }`,
      )
      .join("\n");
  }
  fs.writeFileSync(path.join(root, envFile), buildEnv(true));

  fs.writeFileSync(path.join(root, envFile + ".example"), buildEnv(false));
  const writeFilesArgs = {
    root,
    authInfo,
    distLocation: fw.distLocation?.(getProjectName()) || "dist",
    templatesDir,
    framework: fw,
    admin: admin,
    crud: crud,
    server: safeServer,
    copyDir,
    db,
    projectName: getProjectName(),
    envVariables,
  };

  if (authInfo) {
    copyDir(path.join(templatesDir, "auth", authInfo.name, "shared"), root);
    copyDir(
      path.join(templatesDir, "auth", authInfo.name, safeServerName),
      root,
    );
  }
  if (crud) {
    copyDir(path.join(templatesDir, "crud", "shared"), root);
  }
  fw?.writeFiles?.(writeFilesArgs);
  safeServer.writeFiles?.(writeFilesArgs);

  const cdProjectName = path.relative(cwd, root);
  console.log(`\n🎉 Done. ${gray("Now run:")}\n`);
  if (root !== cwd) {
    console.log(
      `  cd ${
        cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName
      }`,
    );
  }

  console.log(`  ${pkgManager} install`);

  if (safeServer.requiresTwoTerminal) {
    console.log(`  ${gray("Then, open two terminals and run:")}
    ${pkgManager} run dev-node ${gray(" # in one for the backend.")}
    ${pkgManager} run dev ${gray("      # in the other for the frontend.")}`);
  } else {
    console.log(`  ${pkgManager} run dev`);
  }
  console.log("");

  function copy(src: string, dest: string) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      copyDir(src, dest);
    } else if ([".woff"].includes(path.extname(src).toLowerCase())) {
      fs.copyFileSync(src, dest);
    } else {
      let content = fs
        .readFileSync(src)
        .toString()
        .replaceAll("project-name-to-be-replaced", getProjectName());
      if (safeServer?.doesNotLikeJsFileSuffix) content = removeJs(content);
      fs.writeFileSync(dest, content);
    }
  }
  function copyDir(srcDir: string, destDir: string) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const file of fs.readdirSync(srcDir)) {
      const srcFile = path.resolve(srcDir, file);
      const destFile = path.resolve(destDir, file);
      copy(srcFile, destFile);
    }
  }
  function editFile(file: string, callback: (content: string) => string) {
    const fn = path.join(root, file);
    const content = fs.readFileSync(fn, "utf-8");
    fs.writeFileSync(fn, callback(content), "utf-8");
  }
  function editJsonFile(file: string, callback: (content: any) => any) {
    editFile(file, (content) => {
      var j = JSON.parse(content);
      callback(j);
      return JSON.stringify(j, undefined, 2) + "\n";
    });
  }
}

function formatTargetDir(targetDir: string | undefined) {
  return targetDir?.trim().replace(/\/+$/g, "");
}

function isValidPackageName(projectName: string) {
  return /^(?:@[a-z\d\-*~][a-z\d\-*._~]*\/)?[a-z\d\-~][a-z\d\-._~]*$/.test(
    projectName,
  );
}

function toValidPackageName(projectName: string) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]/, "")
    .replace(/[^a-z\d\-~]+/g, "-");
}

function isEmpty(path: string) {
  const files = fs.readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === ".git");
}

function pkgFromUserAgent(userAgent: string | undefined) {
  if (!userAgent) return undefined;
  const pkgSpec = userAgent.split(" ")[0];
  const pkgSpecArr = pkgSpec.split("/");
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}

init().catch((e) => {
  console.error(e);
  process.exit(1);
});
