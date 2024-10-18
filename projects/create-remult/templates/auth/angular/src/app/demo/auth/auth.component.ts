import { Component, OnInit } from "@angular/core";
import { remult } from "remult";
import { TileComponent, type TileStatus } from "../tile/tile.component";

@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  styles: [":host { display: contents; }"],
  standalone: true,
  imports: [TileComponent],
})
export class AuthComponent implements OnInit {
  status: TileStatus = "Loading";
  error?: string;

  ngOnInit(): void {
    remult
      .initUser()
      .then(() => {
        this.status = "Success";
      })
      .catch((e) => {
        this.status = "Error";
        if (e.message.includes("the server configuration")) {
          this.error = `Make sure to set the AUTH_SECRET in the .env file.
Read more at https://errors.authjs.dev#missingsecret.
Please check the server terminal console for more information.`;
        }
      });
  }

  get tileSubtitle(): string {
    if (this.status === "Loading") {
      return "Checking your authentication status";
    } else if (this.status === "Error") {
      return "There seems to be an issue";
    } else {
      return "";
    }
  }

  get isAuthenticated(): boolean {
    return remult.authenticated();
  }

  get userName(): string | undefined {
    return remult.user?.name;
  }
}
