import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProductsComponent } from './products/products.component';

import { CategoriesComponent } from './categories/categories.component';
import { TestComponent } from './test/test.component';

const routes: Routes = [
  { path: 'products', component: ProductsComponent },
  { path: 'test', component: TestComponent },
  { path: 'categories', component: CategoriesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
