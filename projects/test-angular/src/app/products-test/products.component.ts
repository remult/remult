import { Component, OnInit } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod, getFields, IdEntity, isBackend } from 'remult';

import { Products } from './products';
import { DialogConfig, getValueList, GridSettings, InputField, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import axios from 'axios';










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

  constructor() {

  }
  remult = new Remult(axios);

  x = this.remult.repo(stam).create();
  ex: any;
  async ngOnInit() {
    this.x.name = "noam";
    try {
      await this.x.save();
    }
    catch (err) {
      this.ex = err;
    }

  }

}


@Entity<stam>('stam', {
 // allowApiCrud: true,
  saving: self => {
    if (isBackend()) {
      var x = undefined;
      x.toString();
      self.$.name.error = 'name error';
    }
  }
})
class stam extends IdEntity {
  @Field()
  name: string;
}