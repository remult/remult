import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn, ServerController, NumberColumn, ServerMethod, getColumnsFromObject, Entity, EntityClass, IdEntity, OrFilter } from '@remult/core';
import { Products } from './products';
import { DialogService } from '../../../projects/angular/schematics/hello/files/src/app/common/dialog';
import { TestDialogComponent } from '../test-dialog/test-dialog.component';
import { InputAreaComponent } from '../../../projects/angular/schematics/hello/files/src/app/common/input-area/input-area.component';
import { DialogConfig } from '@remult/angular';
import { isConstructorDeclaration } from 'typescript';
import { YesNoQuestionComponent } from '../../../projects/angular/schematics/hello/files/src/app/common/yes-no-question/yes-no-question.component';





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
  grid = this.context.for(Products).gridSettings({
    allowCRUD: true,
    where: p => new OrFilter(p.price.isEqualTo(0), p.price.isEqualTo(5))

  });
  async ngOnInit() {
    let p = this.context.for(Products).create();
    await p.doSomething("the error");

  }
  @ServerFunction({ allowed: true })
  static doTest(a: string, b: string, c: string, context?: Context) {
    console.log({ a, b, c, user: context.user });
  }
  async doIt() {
    await this.context.openDialog(YesNoQuestionComponent, x => x.args = {
      message: 'asdfdsa'
    });
  }


}


