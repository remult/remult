import { Component, OnInit } from '@angular/core';
import { Users } from './users';
import { Context, ServerFunction } from '@remult/core';

import { DialogService } from '../common/dialog';
import { Roles } from './roles';


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  constructor(private dialog: DialogService, public context: Context) {
  }
  isAdmin() {
    return this.context.isAllowed(Roles.admin);
  }

  users = this.context.for(Users).gridSettings({
    allowDelete: true,
    allowInsert: true,
    allowUpdate: true,
    numOfColumnsInGrid: 2,
    get: {
      orderBy: h => [h.name],
      limit: 100
    },
    columnSettings: users => [
      users.name,
      users.admin


    ],
    rowButtons: [{
      name: 'Reset Password',
      click:async  () => {

    if (await this.dialog.yesNoQuestion("Are you sure you want to delete the password of " + this.users.currentRow.name.value)) {
      await UsersComponent.resetPassword(this.users.currentRow.id.value);
      this.dialog.info("Password deleted");
    };
      }
  }
    ],
    confirmDelete: async (h) => {
      return await this.dialog.confirmDelete(h.name.value)
    },
  });
  @ServerFunction({ allowed:Roles.admin })
  static async resetPassword(userId: string, context?: Context) {
    let u = await context.for(Users).findId(userId);
    if (u){
      u.password.value = '';
      await u.save();
    }
  }



  ngOnInit() {
  }

}
