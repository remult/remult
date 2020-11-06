import { Component, OnInit } from '@angular/core';

import { StringColumn } from '@remult/core';
import { Route } from '@angular/router';
import { Context } from '@remult/core';
import { Users } from '../users';

import { ServerSignIn } from "../server-sign-in";
import { JwtSessionManager, RouteHelperService } from '@remult/angular';
import { HomeComponent } from '../../home/home.component';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  constructor(private auth: JwtSessionManager,private context:Context,private route:RouteHelperService) {


  }
  

  confirmPassword = new StringColumn({ caption: 'Confirm Password',dataControlSettings:()=>({ inputType: 'password' })});
  helpers = this.context.for(Users).gridSettings({
    numOfColumnsInGrid: 0,
    allowUpdate: true,
    columnSettings: h => [
      h.name,
      
      h.password,
      { column: this.confirmPassword },
    ],
    validation: h => {
      if (h)
        if (h.password.value != this.confirmPassword.value) {
          h.password.validationError = "passwords do not match";
        }
    } 
  });




  ngOnInit() {
    this.helpers.addNewRow();
  }
  async register() {
    try {
      let userInfo = this.helpers.currentRow;
      await this.helpers._doSavingRow(userInfo);
      this.auth.setToken(await ServerSignIn.signIn(userInfo.name.value, this.confirmPassword.value));
      this.route.navigateToComponent(HomeComponent);
    }
    catch (err) {
      console.log(err);
    }

  }
}
