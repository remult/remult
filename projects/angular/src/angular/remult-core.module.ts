import { NgModule } from '@angular/core';
import { DataControl2Component } from './data-control/data-control2.component';
import { DataControl3Component } from './data-control/data-control3.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DataFilterInfoComponent } from './data-filter-info/data-filter-info.component';
import { DataGrid2Component } from './date-grid-2/data-grid2.component';

import { Remult, FieldMetadata, ValueListItem, remult } from 'remult';
import { actionInfo } from 'remult/src/server-action';

import { NotAuthenticatedGuard, AuthenticatedGuard, RouteHelperService } from './navigate-to-component-route-service';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BusyService, LoaderInterceptor } from './wait/busy-service';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WaitComponent } from './wait/wait.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DataArea2Component } from './data-area/dataArea2';
import { SelectValueDialogComponent } from './add-filter-dialog/add-filter-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FilterDialogComponent } from './filter-dialog/filter-dialog.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { BidiModule } from '@angular/cdk/bidi';
import { Repository, EntityOrderBy, EntityFilter, EntityMetadata } from 'remult';
import { RemultAngularPluginsService } from './RemultAngularPluginsService';








@NgModule({
  declarations: [DataControl2Component, DataArea2Component, DataFilterInfoComponent, DataGrid2Component, WaitComponent, DataControl3Component, SelectValueDialogComponent, FilterDialogComponent],
  imports: [FormsModule, CommonModule, HttpClientModule, MatProgressSpinnerModule, MatDialogModule, BrowserAnimationsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatListModule,
    MatTooltipModule,
    MatInputModule, MatIconModule, ReactiveFormsModule, MatCheckboxModule, MatMenuModule, BidiModule],
  providers: [{
    provide: Remult,
    useFactory: buildContext,
    deps: [HttpClient, MatDialog]
  },
    NotAuthenticatedGuard, AuthenticatedGuard, RouteHelperService,
    BusyService, RemultAngularPluginsService,

  { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }]
  ,
  exports: [DataControl2Component, DataFilterInfoComponent, DataGrid2Component, DataArea2Component, SelectValueDialogComponent],
  entryComponents: [WaitComponent, SelectValueDialogComponent, FilterDialogComponent]
})
export class RemultModule { }
export function DialogConfig(config: MatDialogConfig) {
  return function (target) {
    target[dialogConfigMember] = config;
    return target;
  };
}
const dialogConfigMember = Symbol("dialogConfigMember");
var _matDialog: MatDialog;
export function buildContext(http: HttpClient, _dialog: MatDialog) {
  remult.apiClient.httpClient = http;
  _matDialog = _dialog;


  actionInfo.runActionWithoutBlockingUI = async x => await BusyService.singleInstance.donotWait(x);
  actionInfo.startBusyWithProgress = () => BusyService.singleInstance.startBusyWithProgress()

  return remult;
}


export async function openDialog<T, C>(component: { new(...args: any[]): C; }, setParameters?: (it: C) => void, returnAValue?: (it: C) => T): Promise<T> {

  let ref = _matDialog.open(component, component[dialogConfigMember]);
  if (setParameters)
    setParameters(ref.componentInstance);
  var r;
  if (ref.beforeClosed)
    r = await ref.beforeClosed().toPromise();
  else
    //@ts-ignore
    r = await ref.beforeClose().toPromise();


  if (returnAValue)
    return returnAValue(ref.componentInstance);
  return r;
}
