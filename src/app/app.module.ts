import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RemultModule } from '@remult/core';
import { FormsModule } from '@angular/forms';
import { ProductsComponent } from './products/products.component';
import {DialogService} from '../../projects/core/schematics/hello/files/src/app/common/dialog';
import {YesNoQuestionComponent} from '../../projects/core/schematics/hello/files/src/app/common/yes-no-question/yes-no-question.component';

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



@NgModule({
  declarations: [
    AppComponent,
    ProductsComponent,
    CategoriesComponent,
    TestComponent,
    YesNoQuestionComponent
  ],
  providers:[
    DialogService
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RemultModule,
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
  ],
  entryComponents:[YesNoQuestionComponent],
  
  bootstrap: [AppComponent]
})
export class AppModule { }
