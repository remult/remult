import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, DialogConfig, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn } from '@remult/core';
import { Products } from './products';

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
      readOnly:true
    })
  })

  getWhere() {

    return JSON.stringify(packWhere(this.products.filterHelper.filterRow, this.products.getFilterWithSelectedRows().where));
  }
  constructor(private context: Context) {
    

  }
  area = new DataAreaSettings();

  products = this.context.for(Products).gridSettings({
    allowUpdate: true,
    allowInsert: true,
    allowSelection: true,
    knowTotalRows: true,
    

    onEnterRow: (r) => {
      this.area = new DataAreaSettings({ columnSettings: () => [this.col, r.phone] });
    },
    get: {
      where: p => p.name.isContains("e")
    },
    gridButtons: [
      {
        name: 'xxx'
      }
    ]

  });

  ngOnInit() {

  }
  async test() {
    await ProductsComponent.testIt(2);
  }
  async dialog() {
    try {
      await ProductsComponent.testIt(1);
    }
    catch (err) {
      console.log(err);
      debugger;

    }
  }
  @ServerFunction({ allowed: true })
  static async testIt(amount: Number, context?: Context) {
    console.log(context);
    throw "it didn't work";
    //console.log((await sql.createCommand().execute("select 1 as a,2 as b,3 as c")).rows[0]);
  }

}
