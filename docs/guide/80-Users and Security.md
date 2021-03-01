# Users and Security

The next thing on our feature list is managing users and security for the application.

We want users to be able to register and sign in to the application, and we want to have a role based system where:
1. Only admin users can update Products
2. Non signed in users can only view the products and register if they want.

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

## Securing the Products
Now that we understand how users can be managed, let's start securing the application by restricting access to the `Products`. 

In the `products.ts` 

<<< @/docs-code/products-batch-operations/products.secure.ts{13}

We've changed the `allowApiCRUD` property to only allow it for users that has the role `Roles.admin` (later we'll define new roles)
We've kept the `allowApiRead` to true, since even non signed in users can view products in the `home.component.ts`

This step has secured the `API` which means that even someone who is accessing our server directly, without the application can't update the categories if they are not authorized to do so.

Next we'll secure the `updatePriceOnServer` server function we've used in the `products.component.ts`
```ts{1}
@ServerFunction({allowed:Roles.admin})
  static async updatePriceOnServer(priceToUpdate:number,context?:Context){
```
We've set the `allowed` property to the `Roles.admin` role.

Next let's restrict access to the `products.component.ts` for the users themselves

In the `app-routing.module.ts`
```ts{3}
const routes: Routes = [
//other routes
    { path: 'Products', component: ProductsComponent, canActivate: [AdminGuard]  },
//other routes
];
```

We've added the `, canActivate: [AdminGuard]` definition to the `Products` path. This means that a user that does not have the `admin` role, will not be able to access the categories entry in the menu.
||| tip
Create another user, without admin privliges and see  how that works.
|||
Now that you know about the `canActivate` you can see that several of the prepared routes are using similar guards:
1. AdminGuard - only users that have the `Admin` role.
2. NotSignedInGuard - only users that are not Signed in.
3. SignedInGuard - only users that are signed in.