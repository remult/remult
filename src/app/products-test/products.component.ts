import { Component, OnInit } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod } from 'remult';

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
export class ProductsComponent implements OnInit {

  constructor(private remult: Remult) {

  }

  @DataControl<ProductsComponent>({
    valueList: c => getValueList(c.for(Products)),
    valueChange: (row) => {
      console.log({ val: row.p, prod: row.p instanceof Products })
      row.$.p.load().then(() => console.log("loaded", row.p));
    }
  })
  @Field()
  p: Products;

  get $() { return getFields(this, this.remult) };
  area = new DataAreaSettings({
    fields: () => [this.$.p]
  });
  products = new GridSettings(this.remult.repo(Products), { allowCrud: true });
  async ngOnInit() {
    let p = await this.remult.repo(Products).findFirst();
    
    //this.title = p?.name;
    this.title = await ProductsComponent.doIt(null);

  }
  title: string;


  @BackendMethod({ allowed: true })
  static async doIt(p: Products) {
    if (p == null)
      return 'null';
    return p.name;
  }
}
