import { Component, OnInit } from '@angular/core';
import { Users } from './users';
import { BackendMethod, Remult } from 'remult';

import { DialogService } from '../common/dialog';
import { Roles } from './roles';
import { GridSettings } from '@remult/angular';


@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  constructor(private dialog: DialogService, public remult: Remult) {
  }
  isAdmin() {
    return this.remult.isAllowed(Roles.admin);
  }

  users = new GridSettings(this.remult.repo(Users), {
    allowDelete: true,
    allowInsert: true,
    allowUpdate: true,
    numOfColumnsInGrid: 2,

    orderBy: { name: "asc" },
    rowsInPage: 100,

    columnSettings: users => [
      users.name,
      users.admin


    ],
    rowButtons: [{
      name: 'Reset Password',
      click: async () => {

        if (await this.dialog.yesNoQuestion("Are you sure you want to delete the password of " + this.users.currentRow.name)) {
          await UsersComponent.resetPassword(this.users.currentRow.id);
          this.dialog.info("Password deleted");
        };
      }
    }
    ],
    confirmDelete: async (h) => {
      return await this.dialog.confirmDelete(h.name)
    },
  });
  @BackendMethod({ allowed: Roles.admin })
  static async resetPassword(userId: string, remult?: Remult) {
    let u = await remult!.repo(Users).findId(userId);
    if (u) {
      u.password = '';
      await u._.save();
    }
  }



  ngOnInit() {
  }

}
