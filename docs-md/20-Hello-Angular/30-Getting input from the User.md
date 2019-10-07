Let's add the following line to the `home.component.html` file:
```csdiff
+ What is your name? 
+ <input [(ngModel)]="name">
 <p>
   Hello {{name}}!
 </p>
```
We've added the html `input` tag - and in it we've added the following code `[(ngModel)]="name"` which tells Angular to bind the data from the input, to the `name` field.
Whenever the user will type a value in the `input` html element - the page will recompute to reflect that change.

For example, type in your name in the `input` and you'll be gritted with hello.

> Tip - because we've installed the `angular2-switcher` we can now switch between the `home.component.ts` to the `home.component.html` file easily by pressing <kbd>alt</kbd> + <kbd>O</kbd>. See [angular2-switcher](https://marketplace.visualstudio.com/items?itemName=infinity1207.angular2-switcher) for more shortcuts.

## using If logic in the Html Template *ngIf
Now, we want to make sure that we only greet someone with a name, meaning that if you don't type any value in the `input` we don't won't to write the `Hello ` statement.
We'll do that using Angular's `*ngIf` tag

```csdiff
  What is your name? 
  <input [(ngModel)]="name">
- <p> 
+ <p *ngIf="name.length>0">
     Hello {{name}}!
  </p>
```

By placing the `*ngIf` tag in the `<p>` html element - we've got angular to only write the `<p>` section (and all it's content) into the html if the condition we specified is met.
