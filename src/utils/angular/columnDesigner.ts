import { ColumnCollection ,ColumnSetting} from '../utils';

import { Input, Component } from '@angular/core';
@Component({
  selector: 'column-designer',
  template: `
<div *ngIf="map.designMode" class="columnDesigner">
    <div class="form-group">
        <input type="text" class="form-control" [(ngModel)]="map.caption">
    </div>
    <label>Key</label>
    <div class="form-group">
        <select class="form-control" [(ngModel)]="map.key">
            <option value="" selected></option>
            <option  selected *ngFor="let k of settings._optionalKeys()">{{k}}</option>
        </select>
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

    <div class="checkbox">

        Readonly <input type="checkbox"  [(ngModel)]="map.readonly">
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
`
})
export class ColumnDesigner {
  @Input() map: ColumnSetting<any>;
  @Input() settings: ColumnCollection<any>;
}
