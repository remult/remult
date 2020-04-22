import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, DialogConfig } from '@remult/core';
import { Products } from './products';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height:'1500px'
  
})
export class ProductsComponent implements OnInit {

  constructor(private context: Context) { }
  products = this.context.for(Products).gridSettings({
    allowUpdate: true,
    allowInsert:true,
    columnSettings:p=>[
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
    columnSettings:p=>[
      p.phone
    ]
  });
  ngOnInit() {
  }
  async test() {
    await ProductsComponent.testIt(2);
  }
  dialog(){
    this.context.openDialog(ProductsComponent,()=>{});
  }
  @ServerFunction({ allowed: true })
  static async testIt(amount:Number,context?:Context) {
    console.log(context);
    //console.log((await sql.createCommand().execute("select 1 as a,2 as b,3 as c")).rows[0]);
  }

}
