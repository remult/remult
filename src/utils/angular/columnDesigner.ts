import { ColumnSetting, ColumnCollection } from '../utils';


import { Input, Component } from '@angular/core';
@Component({
  selector: 'column-designer',
  template: `
<div *ngIf="map.designMode" class="columnDesigner">
    <div class="form-group">
        <input type="text" class="form-control" [(ngModel)]="map.caption">
    </div>
    <label>Input Type</label>
    <div class="form-group">
        <select class="form-control" [(ngModel)]="map.inputType" placeholder="inputType">
            <option value="" selected>text</option>
            <option value="number">number</option>
            <option value="date">date</option>
            <option value="checkbox">checkbox</option>
        </select>
    </div>

    <div class="form-group">
      <label>
           <input type="checkbox"  [(ngModel)]="map.readonly"> Readonly
      </label>
    </div>


    <div class="form-group">

        <button class="btn btn-success glyphicon glyphicon-ok pull-left" (click)="settings.designColumn(map)"></button>
        <div class="btn-group pull-right">
                <button class="btn btn-danger glyphicon glyphicon-trash " (click)="settings.deleteCol(map)"></button>
                <button class="btn btn-primary glyphicon glyphicon-plus " (click)="settings.addCol(map)"></button>
                <button class="btn btn-primary glyphicon glyphicon-chevron-left" (click)="settings.moveCol(map,-1)"></button>
                <button class="btn btn-primary glyphicon glyphicon-chevron-right" (click)="settings.moveCol(map,1)"></button>
        </div>
    </div>
</div>
<span class="designModeButton pull-right">
<span class="glyphicon glyphicon-pencil " (click)="settings.designColumn(map)" *ngIf="settings.allowDesignMode"></span>
</span>
`,
  styles: [`.columnDesigner {
  background-color: white;
  position: absolute;
  padding: 10px;
  border-color: gray;
  border-width: 2px;
  border-style: solid;
  z-index: 800;
  border-radius: 5px;
  width: 300px;
}

  .columnDesigner .form-group {
      margin-right: 0;
      margin-left: 0;
  }`]
})
export class ColumnDesigner {
  @Input() map: ColumnSetting<any>;
  @Input() settings: ColumnCollection<any>;
}
