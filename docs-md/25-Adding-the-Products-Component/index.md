In this step we want to create a new Angular `Component` for the `Products` table we want to add and update.

In visual studio code you can open a terminal window to activate commands from the command line.
To open the terminal window click on the `Terminal\new Terminal` menu.

In the terminal window run the following command to create the `Products` component.
```csdiff
ng generate component --skipTests=true products
```

After running this command we'll see that a folder called `products` was created under the `src/app` folder and in it there are three files:
1. products.component.html - the html template of the component
2. products.component.scss - the style sheet file for the component
3. products.component.ts - the typescript code file

## Adding a Route for the component
Next we would like to be able to navigate to the component, so that the user will be able to type the url `https://www.oursite.com/products` they'll reach the products component.

to do that we'll add a route for it in the `app-routing.module.ts`.
> pro tip: you can quickly open a file by clicking <kbd>Control</kbd> + <kbd>P</kbd> and typing the name of the file you want to open.

```csdiff
import { RemultModule, NotSignedInGuard, SignedInGuard } from '@remult/core';
import { NgModule } from '@angular/core';
import { Routes, RouterModule, Route, ActivatedRouteSnapshot } from '@angular/router';
import { HomeComponent } from './home/home.component';

import { RegisterComponent } from './users/register/register.component';
import { UpdateInfoComponent } from './users/update-info/update-info.component';

import { UsersComponent } from './users/users.component';
import { Roles, AdminGuard } from './users/roles';
+import { ProductsComponent } from './products/products.component';


const routes: Routes = [
  { path: 'Home', component: HomeComponent },
+ { path: 'Products', component: ProductsComponent },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard] },

  { path: 'Register', component: RegisterComponent, canActivate: [NotSignedInGuard] },
  { path: 'Account Info', component: UpdateInfoComponent, canActivate: [SignedInGuard] },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes), RemultModule],
  providers: [AdminGuard],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```
1. In the routes array we've added a route with the path `Products` which will call the `ProductsComponent`
2. By default, it'll also be added to the sidebar automatically, so now the users can select it from the menu. 
3. When we'll click on the `Products` menu entry, it'll navigate to our component and we should see the message "products works!"

>Pro Tip: You don't have to start by adding the `import` statement on line 11, instead when you'll start typing the `ProductsComponent`in line 16, vs code will automatically suggest to add the import (most times :)

>Pro Tip 2: If you don't have the `import` statement you need, just hover over the class you need (`Products` in this case), and visual studio will tell you that it `cannot find name 'products'` and will suggest a quick fix that will be to add the import statement.
You can also use <kbd>control</kbd> + <kbd>.</kbd> (dot) and it'll suggest to add the import