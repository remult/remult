import { Component, OnInit } from '@angular/core';
import { DateColumn, BoolColumn, DataAreaSettings } from '@remult/core';
import { StringColumn, ColumnOptions } from '@remult/core';


@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  constructor() { }
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

  ngOnInit() {
  }

}
