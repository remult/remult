import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, DialogConfig, packWhere } from '@remult/core';
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
  getWhere() {

    return JSON.stringify(packWhere(this.products.filterHelper.filterRow, this.products.getFilterWithSelectedRows().where));
  }
  constructor(private context: Context) { }
  products = this.context.for(Products).gridSettings({
    allowUpdate: true,
    allowInsert: true,
    allowSelection: true,
    knowTotalRows: true,


    get: {
      where: p => p.name.isContains("e")
    },
    gridButton: [
      {
        name: 'xxx'
      }
    ],
    columnSettings: p => [
      p.name,
      p.phone,
      p.phone,
      p.phone,
      p.phone,
      p.phone,
      p.phone,
      p.phone
    ]
  });
  area = this.products.addArea({
    columnSettings: p => [
      p.phone
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
