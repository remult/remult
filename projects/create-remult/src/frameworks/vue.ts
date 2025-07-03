import type { Framework, WriteFilesArgs } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { createViteConfig } from "../utils/createViteConfig";
import { writeImports, type Import } from "../utils/writeImports";
import {
  prepareInfoReadmeAndHomepage,
  type ComponentInfo,
} from "../utils/prepareInfoReadmeAndHomepage";
import { createReadmeFile } from "../utils/createReadmeFile";

export const vue: Framework = {
  name: "vue",
  display: "Vue",
  url: "https://v3.vuejs.org/",
  canWorkWithVitePluginExpress: true,
  componentFileSuffix: ".vue",
  writeFiles: (args) => {
    const { authInfo, root } = args;
    fs.writeFileSync(
      path.join(root, "vite.config.ts"),
      createViteConfig({
        framework: "vue",
        authInfo,
        withPlugin: false,
      }),
    );
    var info = prepareInfoReadmeAndHomepage({
      ...args,
      frontendTemplate: "vue",
    });
    const fileName = path.join(args.root, "src", "App.vue");
    writeAppVue(fileName, info, args);
    createReadmeFile(
      args.projectName,
      info.components,
      args.server,
      args.root,
      args.envVariables,
    );
  },
};
export function writeAppVue(
  fileName: string,
  info: {
    components: ComponentInfo[];
    imports: Import[];
    li: (() => string)[];
  },
  args: WriteFilesArgs,
) {
  fs.writeFileSync(
    fileName,
    `<script setup lang="ts">
${writeImports(info.imports, args.server)}
</script>

<template>
  <div class="tiles">
    <Tile
      title="${args.projectName}"
      subtitle=""
      icon="remult"
      class="intro"
      status="Success"
      width="half"
    >
      <div class="tile__title">What's next?</div>
      <div class="button-row">
        <a class="button" href="https://learn.remult.dev/" target="_blank">
          Interactive Tutorial
        </a>
        <a class="button" href="https://remult.dev/docs" target="_blank">
          Documentation
        </a>
        <a
          class="button"
          href="https://github.com/remult/remult"
          target="_blank"
        >
          Github
        </a>
      </div>
      <div class="intro__stack">
        ${info.components
          .map(
            (c) => `<div class="intro__stack-item">
          <span>${c.type}</span>
          ${c.display}
        </div>`,
          )
          .join("\n        ")}
      </div>
    </Tile>
    ${info.li.map((l) => `${l()}`).join("\n    ")}
  </div>
</template>`,
  );
}
