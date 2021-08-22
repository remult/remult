import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, Route,  ActivatedRoute } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';

import { BackendMethod, Remult,  UserInfo } from 'remult';

import { DialogService } from './common/dialog';
import { InputField, openDialog, RouteHelperService } from '@remult/angular';
import { PasswordControl, Users } from './users/users';
import { Roles } from './users/roles';
import { InputAreaComponent } from './common/input-area/input-area.component';
import { JwtHelperService } from '@auth0/angular-jwt';

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
    public remult: Remult) {


  }

  async signIn() {
    let user = new InputField<string>({ caption: "User Name" });
    let password = new PasswordControl();
    openDialog(InputAreaComponent, i => i.args = {
      title: "Sign In",
      fields: () => [
        user,
        password
      ],
      ok: async () => {
        this.setToken(await AppComponent.signIn(user.value, password.value));
      }
    });
  }
  @BackendMethod({ allowed: true })
  static async signIn(user: string, password: string, remult?: Remult) {
    let result: UserInfo;
    let u = await remult.repo(Users).findFirst(h => h.name.isEqualTo(user));
    if (u)
      if (await u.passwordMatches(password)) {
        result = {
          id: u.id,
          roles: [],
          name: u.name
        };
        if (u.admin) {
          result.roles.push(Roles.admin);
        }
      }

    if (result) {
      return (await import('jsonwebtoken')).sign(result, process.env.TOKEN_SIGN_KEY);
    }
    throw new Error("Invalid Sign In Info");
  }
  setToken(token: string) {
    if (token) {
      this.remult.setUser(<UserInfo>new JwtHelperService().decodeToken(token));
      sessionStorage.setItem("auth_token", token);
    }
    else {
      this.remult.setUser(undefined);
      sessionStorage.removeItem("auth_token");
    }
  }
  ngOnInit(): void {
    this.setToken(sessionStorage.getItem('auth_token'))
  }

  signOut() {
    this.setToken(undefined);
    this.router.navigate(['/']);
  }
  signUp() {
    let user = this.remult.repo(Users).create();
    let password = new PasswordControl();
    let confirmPassword = new PasswordControl("Confirm Password");
    openDialog(InputAreaComponent, i => i.args = {
      title: "Sign Up",
      fields: () => [
        user.$.name,
        password,
        confirmPassword
      ],
      ok: async () => {
        if (password.value != confirmPassword.value) {
          confirmPassword.error = "doesn't match password";
          throw new Error(confirmPassword.metadata.caption + " " + confirmPassword.error);
        }
        await user.create(password.value);
        this.setToken(await AppComponent.signIn(user.name, password.value));

      }
    });
  }

  async updateInfo() {
    let user = await this.remult.repo(Users).findId(this.remult.user.id);
    openDialog(InputAreaComponent, i => i.args = {
      title: "Update Info",
      fields: () => [
        user.$.name
      ],
      ok: async () => {
        await user._.save();
      }
    });
  }
  async changePassword() {
    let user = await this.remult.repo(Users).findId(this.remult.user.id);
    let password = new PasswordControl();
    let confirmPassword = new PasswordControl("Confirm Password");
    openDialog(InputAreaComponent, i => i.args = {
      title: "Change Password",
      fields: () => [
        password,
        confirmPassword
      ],
      ok: async () => {
        if (password.value != confirmPassword.value) {
          confirmPassword.error = "doesn't match password";
          throw new Error(confirmPassword.metadata.caption + " " + confirmPassword.error);
        }
        await user.updatePassword(password.value);
        await user._.save();
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
