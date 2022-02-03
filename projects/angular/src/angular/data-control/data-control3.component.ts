

import { Component, Input } from '@angular/core';

import { ErrorStateMatcher } from '@angular/material/core';
import {  FieldMetadata, Entity, ValueListItem } from 'remult';

import { FieldCollection } from '../../../interfaces/src/column-collection';
import { DataControlSettings, decorateDataSettings } from '../../../interfaces/src/public_api';

@Component({
  selector: 'data-control3',
  templateUrl: './data-control3.component.html',
  styleUrls: ['./data-control3.component.scss']
})
export class DataControl3Component {
  @Input() map: DataControlSettings;
  @Input() set column(value: FieldMetadata) {
    this.map = {
      field: value
    };
    decorateDataSettings(this.map.field, this.map);
  }
  @Input() rightToLeft = false;

  theId: any;
  @Input() record: any;

  @Input() notReadonly: false;
  @Input() settings: FieldCollection = new FieldCollection(undefined, () => true, undefined, undefined, () => undefined);
  showDescription() {

    return (this.map.field) && this.map.getValue || !this._getEditable();
  }
  showClick() {
    if (!this.map.click)
      return false;
    if (!this._getEditable())
      return false;
    if (this.map.allowClick === undefined) {
      return true;
    }
    return this.settings.allowClick(this.map, this.record);
  }
  getClickIcon() {
    if (this.map.clickIcon)
      return this.map.clickIcon;
    return 'keyboard_arrow_down'
  }
  dataControlStyle() {

    return this.settings.__dataControlStyle(this.map);
  }
  dummy = { inputValue: '' };
  _getColumn() {
    if (!this.map.field)
      return this.dummy;
    return this.settings.__getColumn(this.map, this.record);

  }
  click() {
    if (this.showClick())
      this.settings._click(this.map, this.record);
  }
  _getEditable() {
    if (this.notReadonly)
      return true;
    return this.settings._getEditable(this.map, this.record);
  }
  ngOnChanges(): void {

  }
  getDropDown(): ValueListItem[] {
    return this.map.valueList as ValueListItem[];
  }
  isSelect(): boolean {
    if (this.map.valueList && this._getEditable())
      return true;
    return false;
  }
  showTextBox() {
    return !this.isSelect() && !this.showCheckbox() && this._getEditable();
  }
  showReadonlyText() {
    return !this._getEditable();
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
    return {
      width: '100%'
    };
  }
  getFloatLabel() {
    if (this.showDescription()) {
      if (this.settings._getColDisplayValue(this.map, this.record))
        return 'always';
    }
    return '';
  }


  ngErrorStateMatches = new class extends ErrorStateMatcher {
    constructor(public parent: DataControl3Component) {
      super();
    }
    isErrorState() {
      return !!this.parent.getError();
    }
  }(this);
}


