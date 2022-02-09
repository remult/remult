import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RemultModule } from '@remult/angular';
import { FormsModule } from '@angular/forms';

//import { InputAreaComponent } from '../../projects/angular/schematics/hello/files/src/app/common/input-area/input-area.component';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoriesComponent } from './categories/categories.component';
import { TestComponent } from './test/test.component';
import { TestDialogComponent } from './test-dialog/test-dialog.component';
import { AComponent, BComponent, ProductsComponent } from './products-test/products.component';
import { JwtModule } from '@auth0/angular-jwt';
import { MatMenuModule } from '@angular/material/menu';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';







@NgModule({
  declarations: [
    AppComponent,
    ProductsComponent,
    CategoriesComponent,
    AComponent,
    BComponent,

    TestComponent,
    //  InputAreaComponent,
    TestDialogComponent
  ],
  providers: [
  ],
  imports: [
    ScrollingModule,
    BrowserModule,
    AppRoutingModule,
    RemultModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatMenuModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: () => sessionStorage.getItem("auth_token")
      }
    })
  ],
  entryComponents: [
    //,InputAreaComponent
    , TestDialogComponent],

  bootstrap: [AppComponent]
})
export class AppModule { }
