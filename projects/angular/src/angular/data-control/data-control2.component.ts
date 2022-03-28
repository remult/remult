import { Component, ComponentFactoryResolver, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { ErrorStateMatcher } from '@angular/material/core';
import { FloatLabelType } from '@angular/material/form-field';
import { Entity, ValueListItem, FieldMetadata, FieldRef } from 'remult';

import { CustomDataComponent, DataControlSettings, decorateDataSettings, FieldCollection, getFieldDefinition } from '../../../interfaces';
import { RemultAngularPluginsService } from '../RemultAngularPluginsService';


@Component({
  selector: 'data-control',
  templateUrl: './data-control2.component.html',
  styleUrls: ['./data-control2.component.scss']
})
export class DataControl2Component {
  @Input() map: DataControlSettings;
  @Input() set field(value: FieldMetadata | FieldRef<any, any>) {
    this.map = {
      field: value
    };
    decorateDataSettings(this.map.field, this.map);
    this.settings.augment(this.plugin.dataControlAugmenter, this.map);
    this.initCustomComponent();
  }
  constructor(private plugin: RemultAngularPluginsService, private componentFactoryResolver: ComponentFactoryResolver) {

  }
  @ViewChild('theId', { read: ViewContainerRef, static: true })
  theId: ViewContainerRef;
  done = false;
  initCustomComponent() {
    if (this.map?.customComponent?.component) {
      if (this.done)
        return;
      const fieldRef = this.map.field as FieldRef;
      if (!fieldRef.metadata) {
        this.map.customComponent = undefined;
      }
      this.done = true;
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory<CustomDataComponent>(this.map.customComponent.component);

      const viewContainerRef = this.theId;
      viewContainerRef.clear();

      const componentRef = viewContainerRef.createComponent<CustomDataComponent>(componentFactory);

      componentRef.instance.args = {
        fieldRef,
        settings: this.map
      }
    }
  }

  @Input() record: any;
  @Input() notReadonly = false;
  @Input() settings: FieldCollection = new FieldCollection(undefined, () => true, undefined, undefined, () => undefined);
  showDescription() {

    return (this.map.field) && this.map.getValue || !this._getEditable();
  }
  getDropDown(): ValueListItem[] {
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
    return this.settings.allowClick(this.map, this.record);
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
  dummy = { inputValue: '' };
  _getColumn() {
    if (!this.map.field)
      return this.dummy;
    return this.settings.__getColumn(this.map, this.record);

  }
  _getEditable() {
    if (this.notReadonly)
      return true;
    return this.settings._getEditable(this.map, this.record);
  }
  ngOnChanges(): void {
    this.initCustomComponent();
  }
  isSelect(): boolean {
    if (this.map.valueList && this._getEditable())
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
  getFloatLabel(): FloatLabelType {
    if (this.showDescription()) {
      if (this.settings._getColDisplayValue(this.map, this.record))
        return 'always';
    }
    return 'auto';
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


