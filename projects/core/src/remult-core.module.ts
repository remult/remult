import { NgModule } from '@angular/core';
import { DataControl2Component } from './angular-components/data-control/data-control2.component';
import { DataControl3Component } from './angular-components/data-control/data-control3.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DataFilterInfoComponent } from './angular-components/data-filter-info/data-filter-info.component';
import { DataGrid2Component } from './angular-components/date-grid-2/data-grid2.component';

import { Context } from './Context';
import { JwtSessionManager } from './jwt-session-manager';
import { NotSignedInGuard, SignedInGuard, RouteHelperService } from './navigate-to-component-route-service';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BusyService, LoaderInterceptor } from './angular-components/wait/busy-service';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WaitComponent } from './angular-components/wait/wait.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule, MatButtonModule, MatCheckboxModule } from '@angular/material';
import { DataArea2Compnent } from './angular-components/data-area/dataArea2';




@NgModule({
  declarations: [ DataControl2Component, DataArea2Compnent,   DataFilterInfoComponent,  DataGrid2Component, WaitComponent,DataControl3Component],
  imports: [FormsModule, CommonModule, HttpClientModule, MatProgressSpinnerModule, MatDialogModule, BrowserAnimationsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule, MatIconModule, ReactiveFormsModule, MatCheckboxModule],
  providers: [Context, JwtSessionManager, NotSignedInGuard, SignedInGuard, RouteHelperService,
    BusyService,

    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }]
  ,
  exports: [ DataControl2Component,   DataFilterInfoComponent,  DataGrid2Component, DataArea2Compnent],
  entryComponents: [WaitComponent]
})
export class RemultModule { }
