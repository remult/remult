import { NgModule } from '@angular/core';
import { DataControlComponent } from './angular-components/data-control/data-control.component';
import { CommonModule } from '@angular/common';
import {FormsModule} from '@angular/forms';
import { DataGridComponent } from './angular-components/data-grid/data-grid.component';
import { ColumnDesigner } from './angular-components/column-designer/column-designer.component';
import { DataFilterInfoComponent } from './angular-components/data-filter-info/data-filter-info.component';
import { DataAreaCompnent } from './angular-components/data-area/dataArea';
import { DataGrid2Component } from './angular-components/date-grid-2/data-grid2.component';
import { SelectPopupComponent } from './angular-components/select-popup.ts/select-popup.component';


@NgModule({
  declarations: [DataControlComponent,DataGridComponent,ColumnDesigner,DataFilterInfoComponent,DataAreaCompnent,DataGrid2Component,SelectPopupComponent],
  imports: [FormsModule,CommonModule]
  ,
  exports: [DataControlComponent,DataGridComponent,ColumnDesigner,DataFilterInfoComponent,DataAreaCompnent,DataGrid2Component,SelectPopupComponent]
})
export class RadWebModule { }
