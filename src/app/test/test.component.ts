import { Component, OnInit } from '@angular/core';
import { DateColumn, BoolColumn, Context, iterateConfig, ServerFunction, SqlDatabase, ServerProgress } from '@remult/core';
import { StringColumn } from '@remult/core';
import { DataAreaSettings } from '@remult/angular';
import { Products } from '../products-test/products';


@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  constructor(private context: Context) { }
  column = new StringColumn();
  column1 = new StringColumn();
  column2 = new StringColumn();
  column3 = new StringColumn();
  column4 = new StringColumn();

  area = new DataAreaSettings({
    columnSettings: (f) => [
      this.column,
      this.column1,
      [{
        column: this.column2,
        visible: () => this.column.value && this.column.value.length > 3


      },
      this.column3],
      this.column4,

    ]
  });

  @ServerFunction({ allowed: true, queue: true })
  static async doIt(context?: Context, progress?: ServerProgress) {
    let total = 100;
    for (let index = 0; index < total; index++) {
      progress.progress(index/total);
      await new Promise((res)=>setTimeout(() => {
        res({});
      }, 100));
    }
    console.log('done');

  }

  async ngOnInit() {

    await TestComponent.doIt();
  }

}
