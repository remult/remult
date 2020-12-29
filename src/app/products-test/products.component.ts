import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn, ServerController, NumberColumn, ServerMethod, getColumnsFromObject, Entity, EntityClass, IdEntity } from '@remult/core';
import { Products } from './products';
import { DialogService } from '../../../projects/angular/schematics/hello/files/src/app/common/dialog';
import { TestDialogComponent } from '../test-dialog/test-dialog.component';
import { InputAreaComponent } from '../../../projects/angular/schematics/hello/files/src/app/common/input-area/input-area.component';
import { DialogConfig } from '@remult/angular';
import { isConstructorDeclaration } from 'typescript';





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
    let x = this.context.for(testEntity).create();
    x.x.value = '2';
    try {
      await x.testIt('1');
    }
    catch {
      console.log('error ' + x.x.validationError);
    }

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
  x = new StringColumn({
    validate: () => {
      if (+this.x.value == 2)
        this.x.validationError = 'the fucking error';
    }
  });
  @ServerMethod()
  async testIt(arg: string) {
    console.log({
      x: this.x.value,
      arg: arg
    });
    return '1234';
  }

}
@EntityClass
export class testEntity extends IdEntity {
  x = new StringColumn({
    validate: () => {
      if (+this.x.value == 2)
        this.x.validationError = 'the fucking error';
    }
    
  });
  constructor() {
    super({
      name:'testEntity',
    });
  }
  @ServerMethod({allowed:true})
  async testIt(arg: string) {
    console.log({
      x: this.x.value,
      arg: arg
    });
    return '1234';
  }

}