# Batch Operations

The next requirement from our users is to be able to update the price of all products by a fixed amount in a simple operation.

For that we'll start by adding a new component called `updatePrice`
```sh
ng generate component --skipTests=true update-price
```

Let's add a route for it:
`app-routing.module.ts`
```ts{5}
const routes: Routes = [
  { path: 'Home', component: HomeComponent },
  { path: 'User Accounts', component: UsersComponent, canActivate: [AdminGuard] },
  { path: 'Products', component: ProductsComponent },
  { path: 'Update-Price', component: UpdatePriceComponent },
  { path: 'Categories', component: CategoriesComponent },
  { path: 'Register', component: RegisterComponent, canActivate: [NotSignedInGuard] },
  { path: 'Account Info', component: UpdateInfoComponent, canActivate: [SignedInGuard] },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home', pathMatch: 'full' }
];
```

Next we'll define the `amountToAdd` member in the `update-price.component.ts` and add a method stub for updating all prices.
```ts{6-8}
export class UpdatePriceComponent implements OnInit {

  constructor() { }
  ngOnInit() {
  }
  amountToAdd:number;
  updatePrices(){
  }
}
```

We'll use Material design to format our [input](https://material.angular.io/components/input/overview) and [button](https://material.angular.io/components/button/overview)
in the `update-price.component.html`
```html
    Please choose the amount to add to all the products:

    <mat-form-field class="example-full-width">
        <input matInput placeholder="Amount to add" [(ngModel)]="amountToAdd" type="number">
    </mat-form-field>
    <br>
    <button (click)="updatePrices()" mat-raised-button color="primary" >Update all Prices</button>
```

Next let's add some validations:
```ts{7-10}
export class UpdatePriceComponent implements OnInit {
  constructor() { }
  ngOnInit() {
  }
  amountToAdd: number;
  updatePrices() {
    if (!this.amountToAdd || this.amountToAdd < 1) {
      alert("Please enter a valid amount");
      return;
    }
 }
}
```

Next let's do the actual work.
```ts{2,6,11-19}
export class UpdatePriceComponent implements OnInit {
  constructor(private context: Context) { }
  ngOnInit() {
  }
  amountToAdd: number;
  async updatePrices() {
    if (!this.amountToAdd || this.amountToAdd < 1) {
      alert("Please enter a valid amount");
      return;
    }
    let products = await this.context.for(Products).find();
    let count = 0;
    for (const p of products) {
      p.price.value += this.amountToAdd;
      await p.save();
      count++;
    }
    alert("updated " + count + " products");
  }
}
```

Let's review:
1. On line 3 we've added the `context` object to the constructor.
2. On line 8 we've marked our method with the `async` keyword.
3. On line 13 we've requested the products from the db using the `await` keyword to wait for the result.
4. On line 17 we've saved the changes we've made to the server, again using the `await` keyword to wait for it's completion.

::: tip Note
 If you get an error, chances are that you have rows in the products table that don't match your validation rules. This can happen since we first added a few test rows, and then we've added some validation, that not all existing rows match.
 Just go to the Products page and fix it.
:::