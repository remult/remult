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
  data: EntityThatSupportsNull[] = [];
  grid = this.context.for(EntityThatSupportsNull).gridSettings({ allowCRUD: true });
  constructor(private context: Context) { }
  async ngOnInit() {
    this.data = await this.context.for(EntityThatSupportsNull).find({ where: x => x.textWithNull.isDifferentFrom("null") });

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
      name:'EntityThatSupportsNull',
      allowApiCRUD:true

    });
  }
}