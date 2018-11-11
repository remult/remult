
import { GridSettings, Column, ColumnSetting } from '../../core/utils';


import { Component, Input } from '@angular/core';
@Component({
    selector: 'Data-Filter',
    template: `<div *ngIf="this.showFilterButton">
  <ul>
    <li *ngFor="let map of settings.columns.filterHelper.filterColumns" (click)="this.showEditFilter(map)"> {{map.caption}}: {{this.getCurrentFilterValue(map)}}
    </li>
    <li (click)="this.showAddAnotherFilterDialog()" *ngIf="!showAddFilter&&!editFilterVisible">...</li>
  </ul>
  <div *ngIf="this.editFilterVisible">
  {{this.filterColumnToAdd.caption}}:
      <data-control *ngIf="this.filterColumnToAdd" [settings]="settings.columns" [map]="this.filterColumnToAdd" [record]="settings.columns.filterHelper.filterRow" [notReadonly]="true"></data-control>
      <button class="btn glyphicon glyphicon-ok btn-success" (click)="this.confirmEditFilter()"></button>
      <button class="btn glyphicon glyphicon-remove btn-primary" (click)="this.clearEditFilter()"></button>
  </div>
  <div *ngIf="this.showAddFilter">
      <select [(ngModel)]="this.filterColumnToAdd" class="form-control selectColumnCombo" (change)="settings.columns.colListChanged()">
          <option *ngFor="let o of settings.origList" [ngValue]="o">{{o.caption}} </option>
      </select>
      <data-control *ngIf="this.filterColumnToAdd" [settings]="settings.columns" [map]="this.filterColumnToAdd" [record]="settings.columns.filterHelper.filterRow" [notReadonly]="true"></data-control>
      <button class="btn glyphicon glyphicon-ok btn-success" (click)="this.addFilter()"></button>
      <button class="btn glyphicon glyphicon-remove btn-primary" (click)="this.cancelAddNewFilter()"></button>
      </div>
  </div>`
})
export class DataFilterInfoComponent {

    @Input() settings: GridSettings<any>;
    filterColumnToAdd: ColumnSetting<any>;
    getCurrentFilterValue(col: Column<any>) {
        let m = this.settings.origList.find(x => x.column == col);
        return this.settings.columns._getColDisplayValue(m, this.settings.filterHelper.filterRow);
    }
    cancelAddFilter() {

    }

    showFilterButton = false;
    showAddFilter = false;
    editFilterVisible = false;
    showEditFilter(col: Column<any>) {
        this.filterColumnToAdd = this.settings.origList.find(x => x.column == col);
        this.editFilterVisible = true;
        this.showAddFilter = false;
    }
    userFilterButton() {
        this.showFilterButton = !this.showFilterButton;
        this.settings.initOrigList();
        if (this.settings.filterHelper.filterColumns.length == 0)
            this.showAddAnotherFilterDialog();
    }
    showAddAnotherFilterDialog() {
        this.showAddFilter = true;
        this.filterColumnToAdd = undefined;
    }
    confirmEditFilter() {
        this.settings.columns.filterRows(this.filterColumnToAdd);
        this.editFilterVisible = false;
    }
    clearEditFilter() {
        this.settings.columns.clearFilter(this.filterColumnToAdd);
        this.editFilterVisible = false;
    }
    addFilter() {
        this.settings.columns.filterRows(this.filterColumnToAdd);
        this.showAddFilter = false;
    }
    cancelAddNewFilter() {
        this.showAddFilter = false;
    }
}