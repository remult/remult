import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, packWhere, BoolColumn, StringColumn, DateColumn, ServerController, NumberColumn, ServerMethod, getColumnsFromObject, Entity, EntityClass, IdEntity, OrFilter, ServerProgress, iterateConfig, OneToMany } from '@remult/core';

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
  rel = new OneToMany(this.context.for(Products));


  products = new GridSettings(this.context.for(Products), {
    allowCRUD: true,
    columnSettings: p => [p.name, { column: p.tags, readOnly: true }],
    allowSelection: true,
    gridButtons: [{
      name: '',
      click: () => {
        openDialog(ProductsComponent);
      }
    }],
    rowButtons: [
      {
        textInMenu: 'noam',
        click: r => {
          if (!r.tags.value)
            r.tags.value = [];
          r.tags.value.push('noam');
        }
      },
      {
        textInMenu: 'yael',
        click: r => {
          if (!r.tags.value)
            r.tags.value = [];
          r.tags.value.push('yael');
        }
      }
    ]
  });

  async ngOnInit() {



  }
  @ServerFunction({ allowed: true, queue: true })
  static async doIt1234() {

    let x;
    x.toString();

  }


}
