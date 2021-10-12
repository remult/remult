import { Component, OnInit } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod, getFields, IdEntity, isBackend } from 'remult';

import { Products } from './products';
import { DialogConfig, getValueList, GridSettings, InputField, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import axios, { AxiosResponse } from 'axios';










function wrapAxios<T>(what: Promise<AxiosResponse<T>>): Promise<any> {
  return what.then(x => x.data, err => {
      if (typeof err.response.data === "string")
          throw Error(err.response.data);
      throw err.response.data
  });
}
export const remult = new Remult({
  get: (url) => wrapAxios(axios.get(url)),
  put: (url, data) => wrapAxios(axios.put(url, data)),
  post: (url, data) => wrapAxios(axios.post(url, data)),
  delete: (url) => wrapAxios(axios.delete(url))
});

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
  async ngOnInit() {
    let r = remult.repo(stam);
    for (const x of await r.find()) {
        await x.delete();
    }
    let c = await r.count();
    if (c!=0){
      console.error({c});
    }
     await r.create({name:'a'}).save();
    await r.create({name:'b'}).save();
    let x = await r.create({name:'c'}).save();
    x.delete().then(()=>r.find().then(y=>{
      console.log(y);
    }))
  }
  
  remult = new Remult(axios);

  x = new GridSettings(this.remult.repo(stam), { allowCrud: true });
}


@Entity<stam>('stam', {
  allowApiCrud: true,
  saving: self => {
    if (isBackend() && false) {
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