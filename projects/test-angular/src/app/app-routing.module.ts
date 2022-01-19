import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


import { CategoriesComponent } from './categories/categories.component';
import { TestComponent } from './test/test.component';


import { ProductsComponent } from './products-test/products.component';
import { RemultModule } from '@remult/angular';






const routes: Routes = [
  { path: 'products', component: ProductsComponent },
  { path: 'test', component: TestComponent },

  { path: 'categories', component: CategoriesComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), RemultModule],
  
  exports: [RouterModule]
})
export class AppRoutingModule { }
