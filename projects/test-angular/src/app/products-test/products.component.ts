import { ChangeDetectionStrategy, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod, getFields, IdEntity, isBackend, DateOnlyField, Controller, Filter, IntegerField } from 'remult';

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
  grid = new GridSettings(this.remult.repo(stam));
  ngOnInit(): void {
    this.remult.repo(stam).find();
  }
  async click() {
    let s = this.remult.repo(stam);
    let t = this.remult.repo(TestId);
    for (const i of [...await s.find(), ...await t.find()]) {
      await i.delete();
    }
    for (let index = 0; index < 10; index++) {

      await s.create({
        name: index + '',
        testId: await t.create({
          id: index,
          name: index + ''
        }).save()
      }).save();

    }
  }

}



@Entity("testId", {
  allowApiCrud: true,
  dbAutoIncrementId: true
})
export class TestId extends EntityBase {
  @IntegerField({
    dbReadOnly: true
  })
  id: number;
  @Field()
  name: string;

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
  @Field()
  testId: TestId;

  @BackendMethod({ allowed: true })
  async myMethod(remult?: Remult) {

  }
}


