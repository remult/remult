import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { prepareInfoReadmeAndHomepage } from "../utils/prepareInfoReadmeAndHomepage";
import { createReadmeFile } from "../utils/createReadmeFile";

export const angular: Framework = {
  name: "angular",
  display: "Angular",
  url: "https://angular.dev/",
  distLocation: (name: string) => `dist/${name}/browser`,
  writeFiles: (args) => {
    if (args.authInfo) {
      const proxy = JSON.parse(
        fs.readFileSync(path.join(args.root, "proxy.conf.json"), "utf-8"),
      );
      proxy["/auth"] = {
        target: "http://localhost:3002",
        secure: false,
      };
      fs.writeFileSync(
        path.join(args.root, "proxy.conf.json"),
        JSON.stringify(proxy, null, 2),
      );
    }

    var info = prepareInfoReadmeAndHomepage({
      ...args,
      frontendTemplate: "angular",
    });
    fs.writeFileSync(
      path.join(args.root, "src", "app", "app.component.ts"),
      `import { Component, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { remult } from 'remult';
import { TileComponent } from './demo/tile/tile.component';
${
  args.crud
    ? `import { TodoComponent } from './demo/todo/todo.component';
`
    : ""
}${
        args.server.requiresTwoTerminal
          ? `import { ServerStatusComponent } from './demo/server-status/server-status.component';
`
          : ""
      }${
        args.authInfo
          ? `import { AuthComponent } from './demo/auth/auth.component';
`
          : ""
      }${
        args.admin
          ? `import { AdminComponent } from './demo/admin/admin.component';
`
          : ""
      }
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    TileComponent,
${
  args.crud
    ? `    TodoComponent,
`
    : ""
}${
        args.server.requiresTwoTerminal
          ? `    ServerStatusComponent,
`
          : ""
      }${
        args.authInfo
          ? `    AuthComponent,
`
          : ``
      }${
        args.admin
          ? `    AdminComponent,
`
          : ``
      }
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  constructor(zone: NgZone) {
    remult.apiClient.wrapMessageHandling = (handler) =>
      zone.run(() => handler());
  }
}
`,
    );
    fs.writeFileSync(
      path.join(args.root, "src", "app", "app.component.html"),
      `<div class="tiles">
  <app-tile
    title="${args.projectName}"
    subtitle=""
    icon="remult"
    className="intro"
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
      <a class="button" href="https://github.com/remult/remult" target="_blank">
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
        .map((c) => c)
        .join("\n      ")}
    </div>
  </app-tile>

  ${info.li
    .map(
      (l) =>
        `${l()
          .replace("<Auth", "<app-auth")
          .replace("<Admin", "<app-admin")
          .replace("<ServerStatus", "<app-server-status")
          .replace("<Todo", "<app-todo")}`,
    )
    .join("\n  ")}
</div>`,
    );
    createReadmeFile(
      args.projectName,
      info.components,
      args.server,
      args.root,
      args.envVariables,
    );
  },
};
