import { ChangeDetectionStrategy, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod, getFields, IdEntity, isBackend } from 'remult';

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



export class ProductsComponent implements OnInit {

  @ViewChild('scroller') scroller: CdkVirtualScrollViewport;

  title = 'Angular Infinite Scrolling List';

  listItems = [];

  loading = false;

  constructor(private ngZone: NgZone, private remult: Remult) {

  }

  ngOnInit(): void {
    this.fetchMore();
  }

  ngAfterViewInit(): void {

    this.scroller.elementScrolled().pipe(
      map(() => this.scroller.measureScrollOffset('bottom')),
      pairwise(),
      filter(([y1, y2]) => (y2 < y1 && y2 < 140)),
      throttleTime(200)
    ).subscribe(() => {
      this.ngZone.run(() => {
        this.fetchMore();
      });
    }
    );
  }
  page = 0;
  fetchMore(): void {
    this.page++;
    this.remult.repo(stam).find({ page: this.page,limit:20 }).then(items =>
      this.listItems = [...this.listItems, ...items]);

    // const images = ['IuLgi9PWETU', 'fIq0tET6llw', 'xcBWeU4ybqs', 'YW3F-C5e8SE', 'H90Af2TFqng'];

    // const newItems = [];
    // for (let i = 0; i < 20; i++) {
    //   const randomListNumber = Math.round(Math.random() * 100);
    //   const randomPhotoId = Math.round(Math.random() * 4);
    //   newItems.push({
    //     name: 'List Item ' + randomListNumber,
    //     content: 'This is some description of the list - item # ' + randomListNumber,
    //     image: `https://source.unsplash.com/${images[randomPhotoId]}/50x50`
    //   });
    // }

    // this.loading = true;
    // setTimeout(() => {
    //   this.loading = false;
    //   this.listItems = [...this.listItems, ...newItems];

    // }, 1000);


  }



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
}