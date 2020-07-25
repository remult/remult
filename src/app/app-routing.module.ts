import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


import { CategoriesComponent } from './categories/categories.component';
import { TestComponent } from './test/test.component';
import { RemultModule } from '@remult/core';
import {DialogService,ShowDialogOnErrorErrorHandler} from '../../projects/core/schematics/hello/files/src/app/common/dialog';
import { ProductsComponent } from '../../docs-code/products/products.component';





const routes: Routes = [
  { path: 'products', component: ProductsComponent },
  { path: 'test', component: TestComponent },
  { path: 'categories', component: CategoriesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), RemultModule],
  providers: [ { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler }],
  exports: [RouterModule]
})
export class AppRoutingModule { }
