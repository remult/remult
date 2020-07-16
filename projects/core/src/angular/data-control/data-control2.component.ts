

import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Column } from '../../column';
import { Entity } from '../../entity';
import { DataControlSettings, ValueListItem } from '../../column-interfaces';
import { ColumnCollection } from '../../column-collection';
import { StringColumn } from '../../columns/string-column';
@Component({
  selector: 'data-control',
  templateUrl: './data-control2.component.html',
  styleUrls: ['./data-control2.component.scss']
})
export class DataControl2Component {
  @Input() map: DataControlSettings;
  @Input() set column(value: Column) {
    this.map = {
      column: value
    };
    this.map.column.__decorateDataSettings(this.map);
  }
  theId: any;
  @Input() record: Entity;
  @Input() notReadonly: false;
  @Input() settings: ColumnCollection = new ColumnCollection(undefined, () => true, undefined, undefined);
  showDescription() {

    return (this.map.column) && this.map.getValue || !this._getEditable();
  }
  getDropDown():ValueListItem[]{
    return this.map.valueList as ValueListItem[];
  }
  showClick() {
    if (!this.map.click)
      return false;
    if (!this._getEditable())
      return false;
    if (this.map.allowClick === undefined) {
      return true;
    }
    return this.map.allowClick(this.record);
  }
  click() {
    if (this.showClick())
      this.settings._click(this.map, this.record);
  }
  getClickIcon() {
    if (this.map.clickIcon)
      return this.map.clickIcon;
    return 'keyboard_arrow_down'
  }
  dataControlStyle() {

    return this.settings.__dataControlStyle(this.map);
  }
  _getColumn() {
    if (!this.map.column)
      return new StringColumn();
    return this.settings.__getColumn(this.map, this.record);

  }
  _getEditable() {
    if (this.notReadonly)
      return true;
    return this.settings._getEditable(this.map);
  }
  ngOnChanges(): void {

  }
  isSelect(): boolean {
    if (this.map.valueList&&this._getEditable())
      return true;
    return false;
  }
  showTextBox() {
    return !this.isSelect() && !this.showCheckbox();
  }
  showCheckbox() {
    return this.settings._getColDataType(this.map) == 'checkbox'
  }
  getError() {
    return this.settings._getError(this.map, this.record);
  }
  getStyle() {
    if (this.showDescription()) {
      if (this.map.hideDataOnInput || !this._getEditable()) {
        return { display: 'none' };
      }
      return { width: '50px' };
    }
    return {};
  }
  getFloatLabel() {
    if (this.showDescription()) {
      if (this.settings._getColDisplayValue(this.map, this.record))
        return 'always';
    }
    return '';
  }


  ngErrorStateMatches = new class extends ErrorStateMatcher {
    constructor(public parent: DataControl2Component) {
      super();
    }
    isErrorState() {
      return !!this.parent.getError();
    }
  }(this);
}


