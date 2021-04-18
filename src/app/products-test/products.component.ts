import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, packWhere, BoolColumn, StringColumn, DateColumn, ServerController, NumberColumn, ServerMethod, getColumnsFromObject, Entity, EntityClass, IdEntity, OrFilter, ServerProgress, iterateConfig, OneToMany } from '@remult/core';

import { Products } from './products';
import { DialogConfig, GridSettings, openDialog } from '@remult/angular';






@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height: '1500px'

})
export class ProductsComponent implements OnInit {


  constructor(private context: Context) { }

  products = new GridSettings(this.context.for(Products));
  async ngOnInit() {



  }



}

