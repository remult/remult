import { RadWebModule } from './../utils/angular/radWebModule';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';






@NgModule({
  imports: [
    BrowserModule, FormsModule,RadWebModule
  ],
  declarations:
    [AppComponent]
  ,
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
