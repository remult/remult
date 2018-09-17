import { SelectPopup } from './../utils';
import { DataGridComponent } from './dataGrid';
import { DataAreaCompnent } from './dataArea';
import { DataControlComponent } from './dataControl';
import { ColumnDesigner } from './columnDesigner';
import { SelectPopupComponent } from './SelectPopup';


import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from "@angular/core";
import { DataFilterInfoComponent } from './data-filter-info';
import { DataGrid2Component } from './dataGrid2';


@NgModule({
  imports: [
    FormsModule, CommonModule
  ],
  declarations:
    [DataGridComponent, DataAreaCompnent, DataControlComponent, ColumnDesigner, SelectPopupComponent,DataGrid2Component,
      DataFilterInfoComponent]
  ,
  providers: [],
  bootstrap: [],
  exports: [DataGridComponent,DataGrid2Component, DataAreaCompnent, SelectPopupComponent,DataControlComponent,DataFilterInfoComponent]

})
export class RadWebModule { }

