import { Component, OnInit } from '@angular/core';
import { Context, ColumnSettings, SqlDatabase, ServerController, ServerMethod, IdEntity, OrFilter, ServerProgress, iterateConfig, Column, getControllerDefs, column, Allowed, dbLoader, inputLoader, jsonLoader, NewEntity, rowHelper, columnImpl, columnDefsImpl, decorateColumnSettings } from '@remult/core';

import { Products } from './products';
import { DialogConfig, GridSettings, InputControl, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import { DataControlSettings } from '../../../dist/angular';








@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height: '1500px'

})
export class ProductsComponent implements OnInit {
  _ = getControllerDefs(this);
  @Column()
  @DataControl<ProductsComponent>({
    caption: 'bla bla',
    click: (x) => {
      alert(x.a);
    }
  })
  a: string = '';
  
  name = new InputControl<string>("noam", { caption: 'name' });
  area = new DataAreaSettings({
    columnSettings: () => {
      let r = [this.name]
      console.log(r);
      return r;
    }
  });
  p: Products;
  constructor(private context: Context) { }
  async ngOnInit() {
    this.p = await this.context.for(Products).findFirst();


  }



}





