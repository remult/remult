import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { Context } from '@remult/core';
import { Categories } from './categories';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {

  constructor(private context: Context) { }

  categories = new GridSettings(this.context.for(Categories), {
    allowCrud: true
  })
  ngOnInit() {
  }

}
