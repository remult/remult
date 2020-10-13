import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, DialogConfig, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn } from '@remult/core';
import { Products } from './products';
import { YesNoQuestionComponent } from '../../../projects/core/schematics/hello/files/src/app/common/yes-no-question/yes-no-question.component';
import { DialogService } from '../../../projects/core/schematics/hello/files/src/app/common/dialog';
import { TestDialogComponent } from '../test-dialog/test-dialog.component';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height: '1500px'

})
export class ProductsComponent implements OnInit {

  col = new DateColumn({
    caption: 'name',
    dataControlSettings: () => ({
      readOnly: true
    })
  });



  constructor(private context: Context, private dialogs: DialogService) {


  }
  area = new DataAreaSettings();

  products = this.context.for(Products).gridSettings({
    allowUpdate: true,
    allowInsert: true,
    allowSelection: true,
    knowTotalRows: true,

    allowDelete: true,
    confirmDelete: async p => {
      return this.dialogs.yesNoQuestion("bla bla " + p.name.value);
    },


    enterRow: (r) => {
      this.area = new DataAreaSettings({ columnSettings: () => [this.col] });
    },
    get: {

    },
    gridButtons: [
      {
        name: 'xxx'
      }
    ],
    rowButtons: [
      {
        icon: 'clear',
        textInMenu: (x) => {
        
          return 'asdf' + x.name.value
        },
        showInLine: true
      }
    ]

  });

  ngOnInit() {

  }
  async test() {
    await ProductsComponent.testIt(2);
  }

  async dialog() {
    let r = await this.context.openDialog(TestDialogComponent);
    console.log(r);
  }
  @ServerFunction({ allowed: true })
  static async testIt(amount: Number, context?: Context) {
    console.log(context);
    throw "it didn't work";
    //console.log((await sql.createCommand().execute("select 1 as a,2 as b,3 as c")).rows[0]);
  }

}
