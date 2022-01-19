import { Component, OnInit } from '@angular/core';
import { async } from '@angular/core/testing';
import { DataAreaSettings } from '@remult/angular';

import { Field, getFields, ValueListFieldType } from 'remult';



@ValueListFieldType( {

})
export class FamilyStatus {


  static Active: FamilyStatus = new FamilyStatus(0);
  static Frozen: FamilyStatus = new FamilyStatus(100);
  static RemovedFromList: FamilyStatus = new FamilyStatus(99);
  static ToDelete: FamilyStatus = new FamilyStatus(98);

  constructor(public id: number) {
  }


}

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
{{b|json}}<br>
{{this.area.fields.items[1].valueList|json}}
   `,
  styleUrls: ['./test.component.scss']
})
export class TestComponent {
  @Field()
  a: number = 1;

  @Field()
  b: FamilyStatus = FamilyStatus.Active;

  area: DataAreaSettings;
  async ngOnInit() {
    this.area = new DataAreaSettings({
      fields: () => [{
        field: getFields(this).a,
        valueList: async () => [{ id: 1, caption: 'abc' }, { id: 2, caption: 'def' }]
      }, getFields(this).b]
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
  getDropDown() {
    return this.map.valueList;
  }

}
