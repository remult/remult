import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn, ServerController, NumberColumn, ServerMethod, getColumnsFromObject, Entity, EntityClass, IdEntity, OrFilter, ServerProgress, iterateConfig } from '@remult/core';
import { Products } from './products';
import { DialogService } from '../../../projects/angular/schematics/hello/files/src/app/common/dialog';
import { TestDialogComponent } from '../test-dialog/test-dialog.component';
import { InputAreaComponent } from '../../../projects/angular/schematics/hello/files/src/app/common/input-area/input-area.component';
import { DialogConfig } from '@remult/angular';
import { isConstructorDeclaration } from 'typescript';
import { YesNoQuestionComponent } from '../../../projects/angular/schematics/hello/files/src/app/common/yes-no-question/yes-no-question.component';
import * as csv from 'convert-csv-to-array';





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


  _n: number;
  get n() {
    return this._n;
  }
  set n(value: number) {
    this._n = +value;
  }
  total: number = 0;
  count: number = 0;
  products = this.context.for(Products).gridSettings({orderBy:p=>p.name});
  async doit() {
    iterateConfig.pageSize = 10;
    for await (const p of this.context.for(Products).iterate(this.products.getFilterWithSelectedRows())) {
      this.count++;

    }
  }
  async ngOnInit() {
    this.total = await this.context.for(Products).count();


  }


}