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
  @Field({})
  @DataControl({})
  x: number;
  @Field()
  @DataControl({})
  y: string;
  @Field()
  @DataControl({})
  z: string;
  get $() { return getFields(this) }
  constructor(private context: Context) {

  }
  products = new GridSettings( this.context.for(Products));

  area = new DataAreaSettings({
    fields: () => [
      [this.$.x, {
        getValue:()=>this.x
        
      }], this.$.z
    ]
  })

}
