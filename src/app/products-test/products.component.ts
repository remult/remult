import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, ServerController, ServerMethod, IdEntity, OrFilter, ServerProgress, iterateConfig, Column } from '@remult/core';

import { Products } from './products';
import { DialogConfig, GridSettings, openDialog } from '@remult/angular';






@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height: '1500px'

})
export class ProductsComponent implements OnInit {


  constructor(private context: Context) { }



  async ngOnInit() {
    let x = new test();
    x.a = 'noam';
    await x.doIt();


  }



}


@ServerController({ allowed: true, key: 'test' })
export class test {
  @Column()
  a: string;
  @ServerMethod()
  async doIt() {
    console.log('hello ' + this.a);
  }
}