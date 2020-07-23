# Users and Security

The next thing on our feature list is managing users and security for the application.

We want users to be able to register and sign in to the application, and we want to have a role based system where:
1. Only admin users can update categories
2. Only users that are Product Managers can update products.
3. Non signed in users can only view the products and register if they want.

We already have a built in security implementation that can do this, let's review how we use it and how it works.

## Creating the first user
We need to create our first user, to do that simply click on the `Register` menu entry, enter your info and click `Register`

![](/2019-10-08_11h09_40.png)

Now that you are signed in you can see your name at the top right toolbar, and you can click it to signout.

![](/2019-10-08_11h16_54.png)

After you sign out, you can click the `sign in` button at the top right and enter your name and password to sign in again.

## User Management
The first user that signs in is by default the application's `Admin` and has access to the `User Accounts` menu entry where users can be managed.

![](/2019-10-08_11h20_28.png)

Here you can manage the users and even reset their password.

## Securing the Categories
Now that we understand how users can be managed, let's start securing the application by restricting access to the `Categories`.

In the `categories.ts`
```ts{10}
import { IdEntity, StringColumn, EntityClass } from '@remult/core';
+import { Roles } from '../users/roles';

@EntityClass
export class Categories extends IdEntity {
    name = new StringColumn();
    constructor() {
        super({
            name: "Categories",
            allowApiCRUD:Roles.admin,
            allowApiRead:true
        });
    }
} 
```

We've changed the `allowApiCRUD` property to only allow it for users that has the role `Roles.admin` (later we'll define new roles)
We've kept the `allowApiRead` to true, since even non signed in users can view products and their categories in the `home.component.ts`

This step has secured the `API` which means that even someone who is accessing our server directly, without the application can't update the categories if they are not authorized to do so.

Next let's restrict access to the `categories.component.ts`

In the `app-routing.module.ts`
```ts{6}
const routes: Routes = [
  { path: 'Home', component: HomeComponent },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard] },
  { path: 'Products', component: ProductsComponent },
  { path: 'Update-Price', component: UpdatePriceComponent },
  { path: 'Categories', component: CategoriesComponent, canActivate: [AdminGuard] },
  { path: 'Register', component: RegisterComponent, canActivate: [NotSignedInGuard] },
  { path: 'Account Info', component: UpdateInfoComponent, canActivate: [SignedInGuard] },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home', pathMatch: 'full' }
];
```

We've added the `, canActivate: [AdminGuard]` definition to the `Categories` path. This means that a user that does not have the `admin` role, will not be able to access the categories entry in the menu.
||| tip
Create another user, without admin privliges and see  how that works.
|||
Now that you know about the `canActivate` you can see that several of the prepared routes are using similar guards:
1. AdminGuard - only users that have the `Admin` role.
2. NotSignedInGuard - only users that are not Signed in.
3. SignedInGuard - only users that are signed in.