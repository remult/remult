import { GridSettings, Column, Context, ServerFunction } from '@remult/core';
import { Component } from '@angular/core';
import * as models from './models';
import { MatDialog } from '@angular/material';
import { WaitComponent } from 'projects/radweb/src/lib/angular-components/wait/wait.component';





@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

})
export class AppComponent {
  constructor(private context: Context, private dialog: MatDialog) {

  }
  x = this.context.for(models.Products).gridSettings({
    allowUpdate: true,
    allowDelete: true,
    allowInsert: true,
    knowTotalRows: true,
    //numOfColumnsInGrid: 100,
    get: { limit: 100 },
    hideDataArea: true,
    onValidate: o => {

    },
    columnSettings: p => [
      p.id, p.productName, p.discontinued,
      {
        getValue: p => this.context.for(models.Products).lookup(x => x.id.isEqualTo(p.id)).productName.value
      }
    ]


  });
  inputType = 'checkbox';
  test: any;
  filterColumn: Column<any>;
  async testIt() {
    await AppComponent.testServer();
  }
  @ServerFunction({ allowed: true })
  static async testServer() {
    console.log("I'm here");
    return "";
  }
}
