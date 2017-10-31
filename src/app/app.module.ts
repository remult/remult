import { DataGridComponent, DataAreaCompnent, DataControlComponent, SelectPopupComponent, ColumnDesigner } from './../utils/utils';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { NoamCompComponent } from './noam-comp/noam-comp.component';






@NgModule({
  imports: [
    BrowserModule, FormsModule
  ],
  declarations:
    [AppComponent,NoamCompComponent, DataGridComponent, DataAreaCompnent, DataControlComponent, ColumnDesigner, SelectPopupComponent]
  ,
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
