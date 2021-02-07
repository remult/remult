import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn, ServerController, NumberColumn, ServerMethod, getColumnsFromObject, Entity, EntityClass, IdEntity, OrFilter, ServerProgress } from '@remult/core';
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

  async ngOnInit() {
    let [count, items] =
      await Promise.all([
        this.context.for(Products).count(x => x.name.isContains('a')),
        this.context.for(Products).find({ where: x => x.name.isContains('a') })
      ]);
    console.log({
      count,
      real: items.length
    })

    console.log( await ProductsComponent.doTest());
    await ProductsComponent.doTest2();
  }
  @ServerFunction({ allowed: true, queue: true })
  static async doTest(context?: Context, progress?: ServerProgress) {
    for (let index = 0; index < 10; index++) {
      await new Promise(r => {
        setTimeout(() => r({}), 300);
      });
      progress.progress(index / 10);

    }

    console.log('Server function with queue');
    return 1234;
  }
  @ServerFunction({ allowed: true })
  static doTest2(context?: Context) {
    console.log('Server function with NO queue');
  }
}