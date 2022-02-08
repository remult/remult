import { ChangeDetectionStrategy, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod, getFields, IdEntity, isBackend, DateOnlyField, Controller, Filter, IntegerField, FieldRef } from 'remult';

import { Products } from './products';
import { DataAreaSettings, getValueList, GridSettings, InputField } from '@remult/angular/interfaces';

import axios, { AxiosResponse } from 'axios';
import { CdkScrollable, CdkVirtualScrollViewport, ScrollDispatcher } from '@angular/cdk/scrolling';
import { filter, map, pairwise, throttleTime } from 'rxjs/operators';
import { timer } from 'rxjs';
import { DialogConfig } from '../../../../angular';
import { RemultAngularPluginsService } from '../../../../angular/src/angular/RemultAngularPluginsService';


@Controller("blabla")

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
  //,changeDetection: ChangeDetectionStrategy.OnPush
})
@DialogConfig({
  height: '1500px'
})
export class ProductsComponent implements OnInit {
  page = 0;
  constructor(private remult: Remult, plugin: RemultAngularPluginsService) {
    plugin.dataControlAugmenter = (f, s) => {
      if (f.options.aha)
        s.click = () => alert("aha");
    }
  }
  grid = new GridSettings(this.remult.repo(stam), { allowCrud: true });
  area: DataAreaSettings;
  field: FieldRef<any, any>;
  ngOnInit(): void {
    setTimeout(() => {
      this.area = new DataAreaSettings({
        fields: () => [this.grid.items[0].$.name]
      });
      this.field = this.grid.items[0].$.name;
    }, 500);
  }
  async click() {

  }

}


@Entity<stam>('stam', {
  allowApiCrud: true,

})
export class stam extends IdEntity {
  @Field({ dbName: 'name', aha: true })
  name: string;
  @DateOnlyField({ allowNull: true })
  stamDate?: Date

  @Field({ serverExpression: () => 'noam' })
  test: string = '';


  @BackendMethod({ allowed: false })
  static async myMethod(remult?: Remult) {

  }
}


declare module 'remult' {
  export interface FieldOptions {
    aha?: boolean
  }
}