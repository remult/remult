import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn, ServerController, NumberColumn, ServerMethod, getColumnsFromObject, Entity, EntityClass, IdEntity, OrFilter, ServerProgress, iterateConfig, GridSettings } from '@remult/core';

import { Products } from './products';
import { DialogConfig,openDialog } from '@remult/angular';






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


  products = new GridSettings( this.context.for(Products),{
    allowCRUD: true,
    columnSettings: p => [p.name, p.a, p.b],
    allowSelection: true,
    gridButtons:[{
      name:'',
      click:()=>{
        openDialog(ProductsComponent);
      }
    }]
  });

  async ngOnInit() {



  }
  @ServerFunction({ allowed: true, queue: true })
  static async doIt1234() {

    let x;
    x.toString();

  }


}
