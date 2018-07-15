import { SelectPopup } from './../utils';
import { DataGridComponent } from './dataGrid';
import { DataAreaCompnent } from './dataArea';
import { DataControlComponent } from './dataControl';
import { ColumnDesigner } from './columnDesigner';
import { SelectPopupComponent } from './SelectPopup';


import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from "@angular/core";


@NgModule({
  imports: [
    FormsModule, CommonModule
  ],
  declarations:
    [DataGridComponent, DataAreaCompnent, DataControlComponent, ColumnDesigner, SelectPopupComponent]
  ,
  providers: [],
  bootstrap: [],
  exports: [DataGridComponent, DataAreaCompnent, SelectPopupComponent,DataControlComponent]

})
export class RadWebModule { }

