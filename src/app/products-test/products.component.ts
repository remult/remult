import { Component, OnInit } from '@angular/core';
import { Context, Field, getControllerDefs, Entity, EntityBase } from '@remult/core';

import { Products } from './products';
import { DialogConfig, getValueList, GridSettings, InputField, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import { DateOnlyField } from '../../../projects/core/src/remult3';








Context.apiBaseUrl = '/dataApi'

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height: '1500px'

})
export class ProductsComponent {



  constructor(private context: Context) { }
  categories = new GridSettings(this.context.for(Categories),
    {

      allowUpdate: true,
      allowInsert: true,
      columnSettings: categories =>
        [
          {
            field: categories.id,
            width: '100px'
          },
          {
            field: categories.categoryName,
             click: () => { },
             width: '150px'
            //,getValue:(x)=>x.categoryName
          },
          categories.categoryName
        ]
    });


}

@Entity({ key: 'Categories' })
export class Categories extends EntityBase {
  @Field({ caption: 'CategoryID' })
  @DataControl({})
  id: number;
  @Field()
  categoryName: string;
  @Field()
  description: string;



}