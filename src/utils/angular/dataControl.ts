import { ColumnCollection,ColumnSetting } from '../utils';

import { Component, Input } from '@angular/core';
@Component({
  selector: 'data-control',
  template: `
<span *ngIf="!_getEditable()" >{{settings._getColValue(map,record)}}</span>
<div *ngIf="_getEditable()" class="" [class.has-error]="settings._getError(map,record)">
    <div >
        <div [class.input-group]="showDescription()||map.click" *ngIf="!isSelect()">
            <div class="input-group-btn" *ngIf="map.click">
                <button type="button" class="btn btn-default" (click)="settings._click(map,record)" > <span class="glyphicon glyphicon-chevron-down"></span></button>
            </div>
            <input class="form-control"  [(ngModel)]="record[map.key]" type="{{settings._getColDataType(map)}}" (ngModelChange)="settings._colValueChanged(map,record)" />
            <div class="input-group-addon" *ngIf="showDescription()">{{settings._getColValue(map,record)}}</div>

        </div>
        <div *ngIf="isSelect()">
            <select  class="form-control" [(ngModel)]="record[map.key]" (ngModelChange)="settings._colValueChanged(map,record)" >
                <option *ngFor="let v of map.dropDown.items" value="{{v.id}}">{{v.caption}}</option>

            </select>
        </div>
    <span class="help-block" *ngIf="settings._getError(map,record)">{{settings._getError(map,record)}}</span>
    </div>
</div>`
})
export class DataControlComponent {
  @Input() map: ColumnSetting<any>;
  @Input() record: any;
  @Input() notReadonly: false;
  showDescription() {
    return this.map.key && this.map.getValue;
  }
  _getEditable() {
    if (this.notReadonly)
      return true;
    return this.settings._getEditable(this.map);
  }
  ngOnChanges(): void {

  }
  isSelect() :boolean{
    if ( this.map.dropDown)
      return true;
    return false;
  }
  @Input() settings: ColumnCollection<any>;
}
