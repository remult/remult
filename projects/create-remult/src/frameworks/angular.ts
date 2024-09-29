import type { Framework } from "../FRAMEWORKS";
import fs from "fs";
import path from "path";
import { createReadmeFile, gatherInfo } from "./react";

export const angular: Framework = {
  name: "angular",
  display: "Angular",
  distLocation: (name: string) => `dist/${name}/browser`,
  writeFiles: (args) => {
    if (args.withAuth) {
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

    var info = gatherInfo({ ...args, frontendTemplate: "angular" });
    fs.writeFileSync(
      path.join(args.root, "src", "app", "app.component.ts"),
      `import { Component, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { remult } from 'remult';
${
  args.crud
    ? `import { TodoComponent } from './demo/todo/todo.component';
`
    : ""
}${
        args.server.requiresTwoTerminal
          ? `import { CheckServerComponent } from './demo/check-server/check-server.component';
`
          : ""
      }${
        args.withAuth
          ? `import { CheckAuthComponent } from './demo/check-auth/check-auth.component';
`
          : ""
      }
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
${
  args.crud
    ? `    TodoComponent,
`
    : ""
}${
        args.server.requiresTwoTerminal
          ? `    CheckServerComponent,
`
          : ""
      }${
        args.withAuth
          ? `    CheckAuthComponent,
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
      `<h1>Welcome to ${args.projectName}!</h1>

<ul>
${info.li
  .map(
    (l) =>
      `<li>${l()
        .replace("<CheckAuth", "<app-check-auth")
        .replace("<CheckServer", "<app-check-server")
        .replace("<Todo", "<app-todo")}</li>`,
  )
  .join("\n  ")}
</ul>
`,
    );
    createReadmeFile(args.projectName, info.components, args.server, args.root);
  },
};
