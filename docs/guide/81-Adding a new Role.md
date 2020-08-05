# Adding a new role
The security system comes with a basic role based system that currently only has the `admin` role.

We can easily add roles, and configure our application to use them.

In the `roles.ts` file:
```ts{6}
import { SignedInGuard } from '@remult/core';
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
```

## Adding a new Guard
Now that we've secured the API we would like to restrict access to the components themselves.

We'll start by creating a new `Guard` in the `roles.ts` file:
```ts{16-22}
import { SignedInGuard } from '@remult/core';
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
@Injectable()
export class ProductManagerGuard extends SignedInGuard {

    isAllowed() {
        return Roles.productManager;
    }
} 
```

We'll also need to register that guard in the `app.module.ts` file:
```ts{20}
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
...
import { InputAreaComponent } from './common/input-area/input-area.component';
import { DialogService } from './common/dialog';
import { AdminGuard, ProductManagerGuard } from './users/roles';
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
   , ProductManagerGuard
  ],
  bootstrap: [AppComponent],
  entryComponents: [YesNoQuestionComponent, SignInComponent, SelectPopupComponent, InputAreaComponent]
})
export class AppModule { }

```

Now we can use this `Guard` in the `app-routing.module.ts`
```ts{3}
const routes: Routes = [
//other routes
{ path: 'Products', component: ProductsComponent, canActivate: [ProductManagerGuard] },
//other routes
];
```

## Assign Product Manager role to Users

### Step 1 add Column to Users Entity
Let's add another `BoolColumn` to the `users` entity, in the `users.ts` file:
```ts{8}
@EntityClass
export class Users extends IdEntity  {
    constructor(private context: Context) {
...
    password = new radweb.StringColumn({ caption: 'password', inputType: 'password', virtualData: () => this.realStoredPassword.value ? Users.emptyPassword : '' });
    createDate = new changeDate('Create Date');
    admin = new BoolColumn();
    productManager = new BoolColumn();
...
}
```

### Step 2 - add Column to the UI
Let's add that column to the UI in the `users.component.ts`
```ts{7,15}
export class UsersComponent implements OnInit {
 ...
  users = this.context.for(Users).gridSettings({
    allowDelete: true,
    allowInsert: true,
    allowUpdate: true,
    numOfColumnsInGrid: 3,
    get: {
      orderBy: h => [h.name],
      limit: 100
    },
    columnSettings: users => [
      users.name,
      users.admin,
      users.productManager
    ],
    confirmDelete: (h, yes) => this.dialog.confirmDelete(h.name.value, yes),
  });
 ...
```

### Step 3, Set Role on User Sign In

The `server-sign-in.ts` file contains the `signIn` function that signs the user in. In that function we would like to add the `productManager` role if the user has it.
```ts{21-23}
import { Roles } from './roles';
import { JWTCookieAuthorizationHelper } from '@remult/core-server';
import { ServerFunction } from '@remult/core';
import { UserInfo, Context } from '@remult/core';
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
                if (h.productManager.value||h.admin.value){
                    result.roles.push(Roles.productManager);
                }
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

