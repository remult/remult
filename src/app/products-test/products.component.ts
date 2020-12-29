import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn, ServerController, NumberColumn, ServerMethod, getColumnsFromObject, Entity, EntityClass } from '@remult/core';
import { Products } from './products';
import { DialogService } from '../../../projects/angular/schematics/hello/files/src/app/common/dialog';
import { TestDialogComponent } from '../test-dialog/test-dialog.component';
import { InputAreaComponent } from '../../../projects/angular/schematics/hello/files/src/app/common/input-area/input-area.component';
import { DialogConfig } from '@remult/angular';





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
    let p = await this.context.for(Products).findFirst();
    p.name.value = 'newName';
    await p.doSomething('some parameter');
    console.log(p.name.value);
    console.log(p.wasChanged());
    
    let x =  new testController();
    x.x.value  = 'noam';
    await x.testIt('hello');

  }


}


@EntityClass
export class EntityThatSupportsNull extends Entity<number> {
  id = new NumberColumn();
  textWithNull = new StringColumn({ allowNull: true });
  datewithnull = new DateColumn({ allowNull: true });
  numberWithNull = new NumberColumn({ allowNull: true });
  boolWithNull = new BoolColumn({ allowNull: true });

  constructor() {
    super({
      name: 'EntityThatSupportsNull',
      allowApiCRUD: true

    });
  }
}
@ServerController({ allowed: true, key: 'testController' })
export class testController {
  x = new StringColumn();
  @ServerMethod()
  async testIt(arg: string) {
    console.log({
      x: this.x.value,
      arg: arg
    });
    return '1234';
  }

}