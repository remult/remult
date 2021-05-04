import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, Route, ActivatedRoute } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';

import { Context, ServerFunction, StringColumn, UserInfo } from '@remult/core';


import { openDialog, RouteHelperService } from '@remult/angular';
import { DialogService } from '../../projects/angular/schematics/hello/files/src/app/common/dialog';
import { InputAreaComponent } from '../../projects/angular/schematics/hello/files/src/app/common/input-area/input-area.component';
import { PasswordColumn, Users } from '../../projects/angular/schematics/hello/files/src/app/users/users';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Roles } from '../../docs-code/users/roles';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {


  constructor(
    public router: Router,
    public activeRoute: ActivatedRoute,
    private routeHelper: RouteHelperService,
    public dialogService: DialogService,
    public context: Context) {


  }
  ngOnInit(): void {
    this.setToken(sessionStorage.getItem("auth_token"));
  }

  async signIn() {
    let user = new StringColumn({ caption: "User Name" });
    let password = new PasswordColumn();
    openDialog(InputAreaComponent, i => i.args = {
      title: "Sign In",
      columnSettings: () => [
        user,
        password
      ],
      ok: async () => {
        this.setToken(await AppComponent.signIn(user.value, password.value));
      }
    });
  }
  @ServerFunction({ allowed: true })
  static async signIn(user: string, password: string, context?: Context) {
    let result: UserInfo;
    let u = await context.for_old(Users).findFirst(h => h.name.isEqualTo(user));
    if (u)
      if (!u.password.value || u.password.matches(password)) {
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
      return (await import('jsonwebtoken'.toString())).sign(result, process.env.TOKEN_SIGN_KEY);
    }
    throw new Error("Invalid Sign In Info");
  }
  setToken(token: string) {
    if (token) {
      this.context.setUser(<UserInfo>new JwtHelperService().decodeToken(token));
      sessionStorage.setItem("auth_token", token);
    }
    else {
      this.context.setUser(undefined);
      sessionStorage.removeItem("auth_token");
    }
  }

  signOut() {
    this.setToken(undefined);
    this.router.navigate(['/']);
  }
  signUp() {
    let user = this.context.for(Users).create();
    let password = new PasswordColumn();
    let confirmPassword = new PasswordColumn({ caption: "Confirm Password" });
    openDialog(InputAreaComponent, i => i.args = {
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
        this.setToken(await AppComponent.signIn(user.name.value, password.value));

      }
    });
  }

  async updateInfo() {
    let user = await this.context.for(Users).findId(this.context.user.id);
    openDialog(InputAreaComponent, i => i.args = {
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
    openDialog(InputAreaComponent, i => i.args = {
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
