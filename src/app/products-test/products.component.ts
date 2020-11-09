import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn, ServerController, NumberColumn, ServerMethod, getColumnsFromObject } from '@remult/core';
import { Products } from './products';
import { DialogService } from '../../../projects/angular/schematics/hello/files/src/app/common/dialog';
import { TestDialogComponent } from '../test-dialog/test-dialog.component';
import { InputAreaComponent } from '../../../projects/angular/schematics/hello/files/src/app/common/input-area/input-area.component';
import { DialogConfig } from '@remult/angular';





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
  operation = new myOperation(this.context);



  constructor(private context: Context, private dialogs: DialogService) {


  }
  area = new DataAreaSettings();



  async ngOnInit() {
    try {
      let p = await this.context.for(Products).find();
     
    } catch (err) {
      alert(err.message);
    }

  }
  async test() {
    try {
      await this.operation.getThingsDone();
    }
    catch (err) {
      alert(err.message);
    }
    //this.products.getRecords();
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
@ServerController({
  key: 'doit',
  allowed: true
})
class myOperation {
  addAmmount = new NumberColumn();
  name = new StringColumn("מה אתה רוצה");
  constructor(private context: Context) { }
  @ServerMethod()
  async getThingsDone() {
    throw 'this is an error';
    console.log('Im here');
    for (const p of await this.context.for(Products).find()) {
      p.price.value += this.addAmmount.value;
      await p.save();
    }
  }
} 


