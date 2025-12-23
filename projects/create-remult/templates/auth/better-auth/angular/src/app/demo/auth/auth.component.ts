import { Component, OnInit } from "@angular/core";
import { remult } from "remult";
import { TileComponent, type TileStatus } from "../tile/tile.component";
import { createAuthClient } from "better-auth/client";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-auth",
  templateUrl: "./auth.component.html",
  styles: [":host { display: contents; }"],
  standalone: true,
  imports: [TileComponent, FormsModule],
})
export class AuthComponent implements OnInit {
  status: TileStatus = "Success";
  error?: string;

  // Form fields
  name = "";
  email = "";
  password = "";
  messageError = "";

  // Better-auth client
  private authClient = createAuthClient({
    // you can pass client configuration here
  });

  ngOnInit(): void {
    remult
      .initUser()
      .then(() => {
        this.status = "Success";
      })
      .catch((e) => {
        this.status = "Error";
        if (e.message.includes("the server configuration")) {
          this.error = `Make sure to set the BETTER_AUTH_SECRET in the .env file.
Read more at https://www.better-auth.com/docs/reference/options#secret.
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

  get userRoles(): string[] {
    return remult.user?.roles ?? [];
  }

  async signUp(): Promise<void> {
    try {
      const res = await this.authClient.signUp.email({
        name: this.name,
        email: this.email,
        password: this.password,
      });
      this.messageError = res.error?.message ?? "";
      if (!res.error) {
        await remult.initUser();
      }
    } catch (error) {
      this.messageError =
        error instanceof Error ? error.message : "Sign up failed";
    }
  }

  async signIn(): Promise<void> {
    try {
      await this.authClient.signIn.email({
        email: this.email,
        password: this.password,
      });
      await remult.initUser();
    } catch (error) {
      this.messageError =
        error instanceof Error ? error.message : "Sign in failed";
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.authClient.signOut();
      remult.user = undefined;
    } catch (error) {
      this.messageError =
        error instanceof Error ? error.message : "Sign out failed";
    }
  }
}
