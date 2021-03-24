import { Component, Injector, ViewChild } from '@angular/core';
import { Router, Route, CanActivate, ActivatedRoute } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog } from '@angular/material/dialog';

import { Context, JwtSessionService, ServerFunction, StringColumn, UserInfo } from '@remult/core';

import { DialogService } from './common/dialog';
import { RouteHelperService } from '@remult/angular';
import { PasswordColumn, Users } from './users/users';
import { Roles } from './users/roles';
import { InputAreaComponent } from './common/input-area/input-area.component';
import { async } from '@angular/core/testing';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {


  constructor(
    public router: Router,
    public activeRoute: ActivatedRoute,
    private routeHelper: RouteHelperService,
    public dialogService: DialogService,
    private session: JwtSessionService,
    public context: Context) {


  }

  async signIn() {
    let user = new StringColumn("User Name");
    let password = new PasswordColumn();
    this.context.openDialog(InputAreaComponent, i => i.args = {
      title: "Sign In",
      columnSettings: () => [
        user,
        password
      ],
      ok: async () => {
        this.session.setToken(await AppComponent.signIn(user.value, password.value));
      }
    });
  }
  @ServerFunction({ allowed: true })
  static async signIn(user: string, password: string, context?: Context) {
    let result: UserInfo;
    let u = await context.for(Users).findFirst(h => h.name.isEqualTo(user));
    if (u)
      if (!u.password.value || PasswordColumn.passwordHelper.verify(password, u.password.value)) {
        result = {
          id: u.id.value,
          roles: [],
          name: u.name.value
        };
        if (u.admin.value) {
          result.roles.push(Roles.admin);
        }
      }

    if (result) {
      return JwtSessionService.createTokenOnServer(result);
    }
    throw new Error("Invalid Sign In Info");
  }

  signOut() {
    this.session.signout();
    this.router.navigate(['/']);
  }
  signUp() {
    let user = this.context.for(Users).create();
    let password = new PasswordColumn();
    let confirmPassword = new PasswordColumn({ caption: "Confirm Password" });
    this.context.openDialog(InputAreaComponent, i => i.args = {
      title: "Sign Up",
      columnSettings: () => [
        user.name,
        password,
        confirmPassword
      ],
      ok: async () => {
        if (password.value != confirmPassword.value) {
          confirmPassword.validationError = "doesn't match password";
          throw new Error(confirmPassword.defs.caption + " " + confirmPassword.validationError);
        }
        await user.create(password.value);
        this.session.setToken(await AppComponent.signIn(user.name.value, password.value));

      }
    });
  }

  async updateInfo() {
    let user = await this.context.for(Users).findId(this.context.user.id);
    this.context.openDialog(InputAreaComponent, i => i.args = {
      title: "Update Info",
      columnSettings: () => [
        user.name
      ],
      ok: async () => {
        await user.save();
      }
    });
  }
  async changePassword() {
    let user = await this.context.for(Users).findId(this.context.user.id);
    let password = new PasswordColumn();
    let confirmPassword = new PasswordColumn({ caption: "Confirm Password" });
    this.context.openDialog(InputAreaComponent, i => i.args = {
      title: "Change Password",
      columnSettings: () => [
        password,
        confirmPassword
      ],
      ok: async () => {
        if (password.value != confirmPassword.value) {
          confirmPassword.validationError = "doesn't match password";
          throw new Error(confirmPassword.defs.caption + " " + confirmPassword.validationError);
        }
        await user.updatePassword(password.value);
        await user.save();
      }
    });

  }

  routeName(route: Route) {
    let name = route.path;
    if (route.data && route.data.name)
      name = route.data.name;
    return name;
  }

  currentTitle() {
    if (this.activeRoute && this.activeRoute.snapshot && this.activeRoute.firstChild)
      if (this.activeRoute.firstChild.data && this.activeRoute.snapshot.firstChild.data.name) {
        return this.activeRoute.snapshot.firstChild.data.name;
      }
      else {
        if (this.activeRoute.firstChild.routeConfig)
          return this.activeRoute.firstChild.routeConfig.path;
      }
    return '<%= project %>';
  }

  shouldDisplayRoute(route: Route) {
    if (!(route.path && route.path.indexOf(':') < 0 && route.path.indexOf('**') < 0))
      return false;
    return this.routeHelper.canNavigateToRoute(route);
  }
  //@ts-ignore ignoring this to match angular 7 and 8
  @ViewChild('sidenav') sidenav: MatSidenav;
  routeClicked() {
    if (this.dialogService.isScreenSmall())
      this.sidenav.close();

  }


}
