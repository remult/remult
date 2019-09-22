import { Component, OnInit } from '@angular/core';
import { StringColumn } from 'radweb';
import { Context } from 'radweb';
import { Users } from '../users';

import { ServerSignIn } from "../server-sign-in";
import { DialogService } from '../../common/dialog';
import { JwtSessionManager } from 'radweb';


@Component({
  selector: 'app-update-info',
  templateUrl: './update-info.component.html',
  styleUrls: ['./update-info.component.scss']
})
export class UpdateInfoComponent implements OnInit {
  constructor(private dialog: DialogService,
    private auth: JwtSessionManager,
    private context: Context) {


  }
  

  confirmPassword = new StringColumn({ caption: 'Confirm Password', inputType: 'password', value: Users.emptyPassword });
  helpers = this.context.for(Users).gridSettings({
    numOfColumnsInGrid: 0,
    allowUpdate: true,
    get: { where: h => h.id.isEqualTo(this.context.user.id) },
    columnSettings: h => [
      h.name,
      h.password,
      { column: this.confirmPassword },
    ],

  });




  ngOnInit() {
    this.helpers.getRecords().then(() => {
      if (!this.helpers.currentRow.password.value)
        this.confirmPassword.value = '';
    });
  }
  async register() {
    try {
      let passwordChanged = this.helpers.currentRow.password.value != this.helpers.currentRow.password.originalValue;
      let thePassword = this.helpers.currentRow.password.value;
      if (this.helpers.currentRow.password.value != this.confirmPassword.value) {
        this.dialog.Error('Password doesn\'t match confirm password');
      }
      else {

        await this.helpers.items[0].save();
        this.dialog.Info("Update saved - thanks");
        this.confirmPassword.value = this.helpers.currentRow.password.value ? Users.emptyPassword : '';
        if (passwordChanged) {
          
          this.auth.setToken(await ServerSignIn.signIn(this.helpers.currentRow.name.value, thePassword));
        }
      }
    }
    catch (err) {

    }

  }

}
