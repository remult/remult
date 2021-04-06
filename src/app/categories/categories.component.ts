import { Component, OnInit } from '@angular/core';
import { Context, GridSettings } from '@remult/core';
import { Categories } from './categories';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {

  constructor(private context:Context) { }

  categories =new GridSettings(this.context.for(Categories));
  ngOnInit() {
  }

}
