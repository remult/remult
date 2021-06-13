import { Component, OnInit } from '@angular/core';
import { Context, Field, getControllerDefs, Entity, EntityBase } from '@remult/core';

import { Products } from './products';
import { DialogConfig, getValueList, GridSettings, InputField, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import { DateOnlyField } from '../../../projects/core/src/remult3';








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

  constructor(private context: Context) { }

  area = new DataAreaSettings({
    fields: () => [getControllerDefs(this).fields.x, {
      field: getControllerDefs(this).fields.x,
      click:null
    }]
  })
}
