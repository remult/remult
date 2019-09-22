import { Component, OnInit } from '@angular/core';
import { Users } from './users';
import { Context } from 'radweb';
import { RunOnServer } from 'radweb';
  
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
    confirmDelete: (h, yes) => this.dialog.confirmDelete(h.name.value, yes),


  });


  resetPassword() {
    this.dialog.YesNoQuestion("Are you sure you want to delete the password of " + this.users.currentRow.name.value, async () => {
      await UsersComponent.resetPassword(this.users.currentRow.id.value);
      this.dialog.Info("Password deleted");
    });

  }
  @RunOnServer({ allowed: c => c.isAllowed(Roles.admin) })
  static async resetPassword(helperId: string, context?: Context) {

    await context.for(Users).foreach(h => h.id.isEqualTo(helperId), async h => {
      h.realStoredPassword.value = '';
      await h.save();
    });
  }



  ngOnInit() {
  }

}
