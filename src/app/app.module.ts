import { RadWebModule } from './../utils/angular/radWebModule';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DataListComponent } from './data-list/data-list.component';






@NgModule({
  imports: [
    BrowserModule, FormsModule,RadWebModule
  ],
  declarations:
    [AppComponent, DataListComponent]
  ,
  providers: [],
  bootstrap: [DataListComponent]
})
export class AppModule { }
