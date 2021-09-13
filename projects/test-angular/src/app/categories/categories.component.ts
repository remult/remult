import { Component, OnInit } from '@angular/core';
import { DataControl, GridSettings } from '@remult/angular';
import { Remult, Field, getFields } from 'remult';
import { Categories } from './categories';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {

  constructor(private remult: Remult) { }

  @Field()
  @DataControl({
    valueList: [{ id: '1', caption: 'a' }, { id: '2', caption: 'b' },{id:null,caption:'null'}]
  })
  something: string = null;

  $ = getFields(this);
  ngOnInit() {
  }

}
