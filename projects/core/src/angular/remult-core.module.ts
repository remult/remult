import { NgModule } from '@angular/core';
import { DataControl2Component } from './data-control/data-control2.component';
import { DataControl3Component } from './data-control/data-control3.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DataFilterInfoComponent } from './data-filter-info/data-filter-info.component';
import { DataGrid2Component } from './date-grid-2/data-grid2.component';

import { Context } from '../context';
import { JwtSessionManager } from '../jwt-session-manager';
import { NotSignedInGuard, SignedInGuard, RouteHelperService } from './navigate-to-component-route-service';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BusyService, LoaderInterceptor } from './wait/busy-service';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WaitComponent } from './wait/wait.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DataArea2Compnent } from './data-area/dataArea2';
import { AddFilterDialogComponent } from './add-filter-dialog/add-filter-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FilterDialogComponent } from './filter-dialog/filter-dialog.component';




@NgModule({
  declarations: [ DataControl2Component, DataArea2Compnent,   DataFilterInfoComponent,  DataGrid2Component, WaitComponent,DataControl3Component,AddFilterDialogComponent,FilterDialogComponent],
  imports: [FormsModule, CommonModule, HttpClientModule, MatProgressSpinnerModule, MatDialogModule, BrowserAnimationsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatListModule,
    MatInputModule, MatIconModule, ReactiveFormsModule, MatCheckboxModule],
  providers: [Context, JwtSessionManager, NotSignedInGuard, SignedInGuard, RouteHelperService,
    BusyService,

    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }]
  ,
  exports: [ DataControl2Component,   DataFilterInfoComponent,  DataGrid2Component, DataArea2Compnent],
  entryComponents: [WaitComponent,AddFilterDialogComponent,FilterDialogComponent]
})
export class RemultModule { }
