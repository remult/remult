import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RadWebModule } from 'radweb';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { LoaderInterceptor } from 'projects/radweb/src/lib/angular-components/wait/busy-service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RadWebModule,
    FormsModule,
  ],
  
  bootstrap: [AppComponent]
})
export class AppModule { }
