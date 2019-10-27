import { NgModule } from '@angular/core';
import { DataControlComponent } from './angular-components/data-control/data-control.component';
import { DataControl2Component } from './angular-components/data-control/data-control2.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataGridComponent } from './angular-components/data-grid/data-grid.component';
import { ColumnDesigner } from './angular-components/column-designer/column-designer.component';
import { DataFilterInfoComponent } from './angular-components/data-filter-info/data-filter-info.component';
import { DataAreaCompnent } from './angular-components/data-area/dataArea';
import { DataGrid2Component } from './angular-components/date-grid-2/data-grid2.component';

import { Context } from './context/Context';
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
  declarations: [DataControlComponent, DataControl2Component, DataArea2Compnent, DataGridComponent, ColumnDesigner, DataFilterInfoComponent, DataAreaCompnent, DataGrid2Component, WaitComponent],
  imports: [FormsModule, CommonModule, HttpClientModule, MatProgressSpinnerModule, MatDialogModule, BrowserAnimationsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule, MatIconModule, ReactiveFormsModule, MatCheckboxModule],
  providers: [Context, JwtSessionManager, NotSignedInGuard, SignedInGuard, RouteHelperService,
    BusyService,

    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }]
  ,
  exports: [DataControlComponent, DataControl2Component, DataGridComponent, ColumnDesigner, DataFilterInfoComponent, DataAreaCompnent, DataGrid2Component, DataArea2Compnent],
  entryComponents: [WaitComponent]
})
export class RadWebModule { }
