import { Component, OnInit } from '@angular/core';
import { async } from '@angular/core/testing';
import { DataAreaSettings } from '../../../projects/angular';

import { Field, getFields } from '../../../projects/core';

@Component({
  selector: 'app-test',
  template: `
   <data-area [settings]="area"></data-area>
   <select matNativeControl [(ngModel)]="a">
     <option *ngFor="let o of this.area.fields.items[0].valueList" [ngValue]="o.id" >{{o.caption}}
</option>
</select>
<select matNativeControl [(ngModel)]="_getColumn().inputValue"
                (ngModelChange)="settings._colValueChanged(map,undefined)">
                <option *ngFor="let v of getDropDown()" [ngValue]="v.id">{{v.caption}}</option>
            </select>
{{a}}<br>
{{this.area.fields.items[0].valueList|json}}
   `,
  styleUrls: ['./test.component.scss']
})
export class TestComponent {
  @Field()
  a: number = 1;

  area: DataAreaSettings;
  async ngOnInit() {
    this.area = new DataAreaSettings({
      fields: () => [{
        field: getFields(this).a,
        valueList: async () => [{ id: 1, caption: 'abc' }, { id: 2, caption: 'def' }]
      }]
    });
    console.log();

  }
  _getColumn() {
    return getFields(this).a;
  }
  get settings() {
    return this.area.fields;
  }
  get map() {
    return this.area.fields.items[0];
  }
  getDropDown(){
    return this.map.valueList;
  }

}