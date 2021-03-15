import { Component, OnInit } from '@angular/core';
import { DateColumn, BoolColumn, DataAreaSettings, Context, iterateConfig, ServerFunction, SqlDatabase, ServerProgress } from '@remult/core';
import { StringColumn, ColumnOptions } from '@remult/core';
import { Products } from '../products-test/products';


@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  constructor(private context: Context) { }
  column = new StringColumn("שלי");
  column1 = new StringColumn("שלי1");
  column2 = new StringColumn("שלי2");
  column3 = new StringColumn("שלי3");
  column4 = new StringColumn("שלי4");

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
