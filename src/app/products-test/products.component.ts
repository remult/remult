import { Component, OnInit } from '@angular/core';
import { Context, Field, Entity, EntityBase, BackendMethod } from '@remult/core';

import { Products } from './products';
import { DialogConfig, getValueList, GridSettings, InputField, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import { DateOnlyField, getFields } from '../../../projects/core/src/remult3';








//Context.apiBaseUrl = '/dataApi'

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height: '1500px'

})
export class ProductsComponent {
  @Field()
  @DataControl({ click: () => { } })
  x: string;

  constructor(private context: Context) {
    ProductsComponent.doit();
  }

  area = new DataAreaSettings({
    fields: () => [getFields(this).x, {
      field: getFields(this).x,
      click: null
    }]
  })
  grid = new GridSettings(this.context.for(Products), {
    allowCrud: true,
    where: x => x.name.contains("1"),
    gridButtons: [{
      name: 'dosomething',
      visible: () => this.grid.selectedRows.length > 0
    }]
  });
  @BackendMethod({ allowed: true })
  static async doit(context?: Context) {
    console.log('doing it', {
      backend: context.backend
    });

  }
}
