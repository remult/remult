import { Component, OnInit } from '@angular/core';
import { DateColumn, BoolColumn, DataAreaSettings, Context, iterateConfig, ServerFunction, SqlDatabase } from '@remult/core';
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

  @ServerFunction({ allowed: true })
  static async doIt(context?: Context,db?:SqlDatabase) {
    iterateConfig.pageSize = 20;
    let i = 0;
    let d:Date;
    for await (const p of context.for(Products).iterate({
      orderBy: x => [{ column: x.availableFrom1, descending: false }]
    })) {
      i++;
      d = p.availableFrom1.value;
      
      console.log(i + ':' + p.name.value + " - " + p.availableFrom1.value.toISOString());
      break;
    }
    
    let p = await context.for(Products).findFirst(x=>x.availableFrom1.isGreaterOrEqualTo(d).and(x.availableFrom1.isLessOrEqualTo(d)));
    console.log(p);
    
    
  }

  async ngOnInit() {

    await TestComponent.doIt();
  }

}
