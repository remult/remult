import { NgModule } from '@angular/core';
import { DataControlComponent } from './angular-components/data-control/data-control.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataGridComponent } from './angular-components/data-grid/data-grid.component';
import { ColumnDesigner } from './angular-components/column-designer/column-designer.component';
import { DataFilterInfoComponent } from './angular-components/data-filter-info/data-filter-info.component';
import { DataAreaCompnent } from './angular-components/data-area/dataArea';
import { DataGrid2Component } from './angular-components/date-grid-2/data-grid2.component';
import { SelectPopupComponent } from './angular-components/select-popup.ts/select-popup.component';
import { Context } from './context/Context';
import { JwtSessionManager } from './jwt-session-manager';
import { NotSignedInGuard, SignedInGuard, RouteHelperService } from './navigate-to-component-route-service';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BusyService, LoaderInterceptor } from './angular-components/wait/busy-service';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WaitComponent } from './angular-components/wait/wait.component';



@NgModule({
  declarations: [DataControlComponent, DataGridComponent, ColumnDesigner, DataFilterInfoComponent, DataAreaCompnent, DataGrid2Component, SelectPopupComponent,WaitComponent],
  imports: [FormsModule, CommonModule, HttpClientModule, MatProgressSpinnerModule,MatDialogModule,BrowserAnimationsModule],
  providers: [Context, JwtSessionManager, NotSignedInGuard, SignedInGuard, RouteHelperService,
    BusyService,
    
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }]
  ,
  exports: [DataControlComponent, DataGridComponent, ColumnDesigner, DataFilterInfoComponent, DataAreaCompnent, DataGrid2Component, SelectPopupComponent],
  entryComponents:[WaitComponent]
})
export class RadWebModule { }
