import { ChangeDetectionStrategy, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod, getFields, IdEntity, isBackend, DateOnlyField } from 'remult';

import { Products } from './products';
import { DialogConfig, getValueList, GridSettings, InputField, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import axios, { AxiosResponse } from 'axios';
import { CdkScrollable, CdkVirtualScrollViewport, ScrollDispatcher } from '@angular/cdk/scrolling';
import { filter, map, pairwise, throttleTime } from 'rxjs/operators';
import { timer } from 'rxjs';



@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
  //,changeDetection: ChangeDetectionStrategy.OnPush
})




@DialogConfig({
  height: '1500px'

})



export class ProductsComponent {

  constructor(private remult: Remult) {

  }
  grid = new GridSettings(this.remult.repo(stam), { allowCrud: true });
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
  @Field({ dbName: 'name' })
  name: string;
  @DateOnlyField({ allowNull: true })
  stamDate?: Date
}