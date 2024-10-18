import { Component, OnInit } from "@angular/core";
import { remult } from "remult";
import { TileComponent, type TileStatus } from "../tile/tile.component";

@Component({
  selector: "app-server-status",
  templateUrl: "./server-status.component.html",
  styles: [":host { display: contents; }"],
  standalone: true,
  imports: [TileComponent],
})
export class ServerStatusComponent implements OnInit {
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

        if (e.message?.includes("the server configuration")) {
          this.error =
            "Make sure to set the AUTH_SECRET in the .env file.\nRead more at https://errors.authjs.dev#missingsecret.";
        } else {
          this.error = "Please run npm run dev-node in a separate terminal.";
        }
      });
  }

  get subtitle(): string {
    if (this.status === "Success") {
      return "Up and running";
    } else if (this.status === "Error") {
      return "There seems to be an issue";
    } else {
      return this.status;
    }
  }
}
