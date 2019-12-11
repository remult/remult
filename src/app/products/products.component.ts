import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase } from '@remult/core';
import { Products } from './products';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  constructor(private context: Context) { }
  products = this.context.for(Products).gridSettings({});

  ngOnInit() {
  }
  async test(){
    await ProductsComponent.testIt();
  }
  @ServerFunction({ allowed: true })
  static async testIt(sql?:SqlDatabase) {
    console.log((await sql.createCommand().execute("select 1 as a,2 as b,3 as c")).rows[0]);
  }

}
