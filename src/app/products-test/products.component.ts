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


  async ngOnInit() {



    var p = await this.context.for(Products).findFirst();
    try {
      p.name.value += '1';
      await p.save();
    }
    catch (err) {
      console.log("entity save");
      console.log(err);
      console.log({ entityVE: p.validationError, nameVE: p.name.validationError })
    }
    try {
      var p = await this.context.for(Products).findFirst();
      p.name.value += '1';
      await p.doit();
    }
    catch (err) {
      console.log("entity server method");
      console.log(err);
    }
    try {
      await ProductsComponent.doServerFunction();
    }
    catch (err) {
      console.log("server function");
      console.log(err);
    }
    try {
      await new myController(this.context).doit();
    }
    catch (err) {
      console.log("server function");
      console.log(err);
    }


  }
  @ServerFunction({ allowed: true })
  static async doServerFunction(context?: Context) {
    let a = {};
    //a['123'].toString();
    throw new Error('123');
    var p = await context.for(Products).findFirst();
    p.name.value += '1';
    await p.save();
  }



}

@ServerController({ allowed: true, key: 'myContorller' })
class myController {
  a = new StringColumn();
  constructor(private context?: Context) {

  }
  @ServerMethod()
  async doit() {
    var p = await this.context.for(Products).findFirst();
    p.name.value += '1';
    await p.save();

  }

}