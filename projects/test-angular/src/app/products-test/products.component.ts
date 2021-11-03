import { ChangeDetectionStrategy, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod, getFields, IdEntity, isBackend, DateOnlyField, Controller,  FilterFactories, Filter } from 'remult';

import { Products } from './products';
import { DialogConfig, getValueList, GridSettings, InputField, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import axios, { AxiosResponse } from 'axios';
import { CdkScrollable, CdkVirtualScrollViewport, ScrollDispatcher } from '@angular/cdk/scrolling';
import { filter, map, pairwise, throttleTime } from 'rxjs/operators';
import { timer } from 'rxjs';


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
  constructor(private remult: Remult) {

  }
  ngOnInit(): void {
    new Remult(axios).repo(stam).create({ name: '1234' }).save().then(y => console.log(y));
  }
  items: stam[] = [];
  repo = this.remult.repo(stam);
  load() {
    this.repo.find({ page: this.page }).then(r => this.items.push(...r));
  }
  nextPage() {
    this.page++;
    this.load();
  }

  @BackendMethod({ allowed: true })
  static async myMethod(remult?: Remult) {

  }
  @BackendMethod({ allowed: true })
  async myMethod2(remult?: Remult) {

  }
  async run() {
    for await (const s of this.repo.iterate()) {

    }
    let z = this.repo.iterate()[Symbol.asyncIterator]();

    let r = await z.next();





  }
  grid = new GridSettings(this.remult.repo(stam), { allowCrud: true });
}


@Entity<stam>('stam', {
  allowApiCrud: true,
  saving: self => {
    console.log(self.test);
    if (isBackend() && false) {
      var x = undefined;
      x.toString();
      self.$.name.error = 'name error';
    }
  }
})
export class stam extends IdEntity {
  @Field({ dbName: 'name' })
  name: string;
  @DateOnlyField({ allowNull: true })
  stamDate?: Date

  @Field({ serverExpression: () => 'noam' })
  test: string = '';

  @BackendMethod({ allowed: true })
  async myMethod(remult?: Remult) {

  }
}

let where: EntityFilter<stam> = x => x.name.isEqualTo("a");
interface otherFilters<T> {
  ne?: T | T[],
  gt?: T,
  gte?: T,
  lt?: T,
  lte?: T
}
export type Test<entityType> = {
  [Properties in keyof entityType]?: entityType[Properties] | entityType[Properties][] | otherFilters<entityType[Properties]>;
}
export declare type EntityFilter<entityType> = ((entityType: FilterFactories<entityType>) => (Filter | Promise<Filter> | (Filter | Promise<Filter>)[] | Promise<Filter[]>));
export interface Test2<entityType> {
  OR: Test<entityType>[]
}
let w: Test2<stam> | Test<stam>|EntityFilter<stam> = {
  
  name: ['abc', "def"],
  id: {
    ne: "asd"
  },
  OR: [
    { name: 'a' },
    { name: 'b' }
  ]
}