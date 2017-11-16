import { radWebModule } from './../utils/utils';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';






@NgModule({
  imports: [
    BrowserModule, FormsModule,radWebModule
  ],
  declarations:
    [AppComponent]
  ,
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
