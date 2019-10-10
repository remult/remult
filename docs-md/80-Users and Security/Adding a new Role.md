The security system comes with a basic role based system that currently only has the `admin` role.

We can easily add roles, and configure our application to use them.

In the `roles.ts` file:
```csdiff
import { SignedInGuard } from 'radweb';
import { Injectable } from '@angular/core';

export const Roles = { 
    admin: 'admin'
+   , productManager: 'productManager'
}

@Injectable()
export class AdminGuard extends SignedInGuard {

    isAllowed() {
        return Roles.admin;
    }
} 
```

We've added the `productManager` role to the `Roles` const.
Now let's use it throughout our application:
in the `products.ts`
```csdiff
@EntityClass
export class Products extends IdEntity {
    ...
    category = new CategoryId(this.context);
    constructor(private context:Context) {
        super({
            name: "Products",
-           allowApiCRUD: true,
+           allowApiCRUD: Roles.productManager,
            allowApiRead: true
        });
    }
} 
```

We'll also need to secure the `ServerFunction` that updates the prices, in the `update-price.component.ts`
```csdiff
export class UpdatePriceComponent implements OnInit {
  ...
- @ServerFunction({ allowed: true })
+ @ServerFunction({ allowed: Roles.productManager })
  static async actualUpdatePrices(amountToAdd:number,context?:Context) {
    let products = await context.for(Products).find({});
    let count = 0;
    for (const p of products) {
      p.price.value += amountToAdd;
      await p.save();
      count++;
    }
    return count;
  }
}
```
## Adding a new Guard
Now that we've secured the API we would like to restrict access to the components themselves.

We'll start by creating a new `Guard` in the `roles.ts` file:
```csdiff
import { SignedInGuard } from 'radweb';
import { Injectable } from '@angular/core';

export const Roles = { 
    admin: 'admin'
    , productManager: 'productManager'
}

@Injectable()
export class AdminGuard extends SignedInGuard {

    isAllowed() {
        return Roles.admin;
    }
} 
+@Injectable()
+export class ProductManagerGuard extends SignedInGuard {
+
+    isAllowed() {
+        return Roles.productManager;
+    }
+} 
```

We'll also need to register that guard in the `app.module.ts` file:
```csdiff
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
...
import { InputAreaComponent } from './common/input-area/input-area.component';
import { DialogService } from './common/dialog';
-import { AdminGuard } from './users/roles';
+import { AdminGuard, ProductManagerGuard } from './users/roles';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
...

@NgModule({
  declarations: [
  ...
  ],
  imports: [
  ...
  ],
  providers: [
    DialogService,
    AdminGuard
+   , ProductManagerGuard
  ],
  bootstrap: [AppComponent],
  entryComponents: [YesNoQuestionComponent, SignInComponent, SelectPopupComponent, InputAreaComponent]
})
export class AppModule { }

```

Now we can use this `Guard` in the `app-routing.module.ts`
```csdiff
const routes: Routes = [
  { path: 'Home', component: HomeComponent },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard] },
- { path: 'Products', component: ProductsComponent },
- { path: 'Update-Price', component: UpdatePriceComponent },
+ { path: 'Products', component: ProductsComponent, canActivate: [ProductManagerGuard] },
+ { path: 'Update-Price', component: UpdatePriceComponent, canActivate: [ProductManagerGuard] },
  { path: 'Categories', component: CategoriesComponent, canActivate: [AdminGuard] },
  { path: 'Register', component: RegisterComponent, canActivate: [NotSignedInGuard] },
  { path: 'Account Info', component: UpdateInfoComponent, canActivate: [SignedInGuard] },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home', pathMatch: 'full' }
];
```

## Assign Product Manager role to Users

### Step 1 add Column to Users Entity
Let's add another `BoolColumn` to the `users` entity, in the `users.ts` file:
```csdiff
@EntityClass
export class Users extends IdEntity  {
    constructor(private context: Context) {
...
    password = new radweb.StringColumn({ caption: 'password', inputType: 'password', virtualData: () => this.realStoredPassword.value ? Users.emptyPassword : '' });
    createDate = new changeDate('Create Date');
    admin = new BoolColumn();
+   productManager = new BoolColumn();
...
}
```

### Step 2 - add Column to the UI
Let's add that column to the UI in the `users.component.ts`
```csdiff

export class UsersComponent implements OnInit {
 ...
  users = this.context.for(Users).gridSettings({
    allowDelete: true,
    allowInsert: true,
    allowUpdate: true,
-   numOfColumnsInGrid: 2,
+   numOfColumnsInGrid: 3,
    get: {
      orderBy: h => [h.name],
      limit: 100
    },
    columnSettings: users => [
      users.name,
      users.admin,
+     users.productManager
    ],
    confirmDelete: (h, yes) => this.dialog.confirmDelete(h.name.value, yes),
  });
 ...
```

### Step 3, Set Role on User Sign In

The `server-sign-in.ts` file contains the `signIn` function that signs the user in. In that function we would like to add the `productManager` role if the user has it.
```csdiff
import { Roles } from './roles';
import { JWTCookieAuthorizationHelper } from 'radweb-server';
import { ServerFunction } from 'radweb';
import { UserInfo, Context } from 'radweb';
import { Users } from './users';
export class ServerSignIn {
    static helper: JWTCookieAuthorizationHelper;
    @ServerFunction({ allowed: () => true })
    static async signIn(user: string, password: string, context?: Context) {
        let result: UserInfo;
        await context.for(Users).foreach(h => h.name.isEqualTo(user), async (h) => {
            if (!h.realStoredPassword.value || Users.passwordHelper.verify(password, h.realStoredPassword.value)) {
                result = {
                    id: h.id.value,
                    roles: [],
                    name: h.name.value
                };
                if (h.admin.value) {
                    result.roles.push(Roles.admin);
                }
+               if (h.productManager.value||h.admin.value){
+                   result.roles.push(Roles.productManager);
+               }
            }
        });
        if (result) {
            return ServerSignIn.helper.createSecuredTokenBasedOn(<any>result);
        }
        return undefined;
    }
}
```

Note that you'll have to sign out and sign back in to have this role.

