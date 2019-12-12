import { Component, OnInit } from '@angular/core';
import { DateColumn, BoolColumn } from '@remult/core';
import { StringColumn, ColumnOptions } from '@remult/core';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  constructor() { }
  column = new StringColumn("שלי");
  ngOnInit() {
  }

}
