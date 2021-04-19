# How to create a dialog

Some times we want to open a dialog user interface where the user has to complete some operation.
In this article we'll specify how it's done.

For this sample will create a dialog called `Question` and demonstrate it's usage.

We'll start by creating the component that we'll use for the dialog.

In the command line run
```sh
ng g c --skipTests=true question
```

For a normal component, at this stage we would create a route, but since this is a dialog - we don't want the user to navigate to - we'll not do that.

Now that we have the component, let's call it.

let's add a button in the `home.component` and call the `testDialog` method that we'll add to the `home.component.ts` class:
```ts
import { openDialog } from '@remult/angular';
....
  async testDialog() {
     await openDialog(QuestionComponent);
  }
```

Test that it works by clicking on the button.

Note that we use the `await` syntax here - that means that the code will "wait" for the dialog to be closed before continuing, which can be useful in multiple scenarios.

:::tip
The dialog we use is based in angular material's dialog, you can read more about it in [angular material docs](https://material.angular.io/components/dialog/overview)
:::

Let's set the html based on angular material's example. In `question.component.html` we'll set the following html:
```html
<h1 mat-dialog-title>Title</h1>
<div mat-dialog-content>
  <p>Question?</p>
</div>
<div mat-dialog-actions>
  <button mat-button >No Thanks</button>
  <button mat-button cdkFocusInitial>Ok</button>
</div>
```

Now it looks a bit better.

## Sending arguments to the component
Now that we have our component, we want to send it arguments.

There are many ways this can be accomplished, but in our code we follow the convention of defining an `args` object and setting it's values.

In the `question.component.ts` file:
```ts{3-6}
export class QuestionComponent implements OnInit {
  constructor() { }
  args:{
    title:string,
    question:string
  };
  ngOnInit() {
  }
}
```

let's adjust the html in the `question.component.ts`
```html{1,3}
<h1 mat-dialog-title>{{args.title}}</h1>
<div mat-dialog-content>
  <p>{{args.question}}?</p>
</div>
<div mat-dialog-actions>
  <button mat-button >No Thanks</button>
  <button mat-button cdkFocusInitial>Ok</button>
</div>
```

Now let's send these arguments from the calling code in `home.component.ts`
```ts{3-6}
async testDialog() {
  await this.context.openDialog(QuestionComponent, 
    q => q.args = {
      title: 'How great is this',
      question: "Isn't this great"
  });
}
```
The Second parameter of the `openDialog` method is a function that will be called after the dialog component was created - we can use that to send arguments to our component by settings it's `args` member.
:::tip
this function s a function like any other, you can use {} and call what ever you want here - we just use the `args` member as a quick and easy way for settings the args that the component needs
:::

## Getting a return value from the Component
Next, we want to adjust the component to return true if the user clicked on ok.

In the `question.component.ts` file:
```ts{9-17}
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss']
})
export class QuestionComponent implements OnInit {
  constructor(private dialogRef: MatDialogRef<any>) { }
  noThanks() {
    this.dialogRef.close();
  }
  clickedOk = false;
  ok() {
    this.clickedOk = true;
    this.dialogRef.close();
  }
  args: {
    title: string,
    question: string
  }
  ngOnInit() {
  }
}
```
* We've added a new parameter to our constructor of type `MatDialogRef<any>` angular will `inject` it for us with a reference that controls the dialog in which this component is displayed. we'll use it to call the `close` method when we want to close the dialog.
* We've added two method,s on for `noThanks` and one for `ok`

In the `question.component.html` let's call these methods:
```html{6,7}
<h1 mat-dialog-title>{{args.title}}</h1>
<div mat-dialog-content>
  <p>{{args.question}}?</p>
</div>
<div mat-dialog-actions>
  <button mat-button (click)="noThanks()">No Thanks</button>
  <button mat-button cdkFocusInitial (click)="ok()">Ok</button>
</div>
```
::: tip
If we want a button just to close the dialog, we don't need to create a method for it - we can just tag it with the material tag: `[mat-dialog-close]`
for example:
```html
<button mat-button [mat-dialog-close]>No Thanks</button>
```
:::

Now let's adjust the codes that calls the dialog to get the result.
The `openDialog` method receives a 3rd parameter which is a function that will be called when the dialog is closed - we'll use that to get the return value. The `openDialog` method will return the value that is returned by this 3rd parameter function

In the `home.component.ts`
```ts{4}
async testDialog() {
    if (await this.context.openDialog(QuestionComponent, q => q.args = {
      title: 'How great is this',
      question: "Isn't this great"
    }, q => q.clickedOk)) {
      console.log("so we agree");
    }
    else
      console.log("there must be something wrong with you");
  }
```
By using this 3rd parameter we can now wrap the call with an if statement and work accordingly.
:::tip
you can see the values that are sent to the `console.log` method by opening the browser developer tools (usually the shortcut is F12) and reviewing the `console` window
:::

:::tip note
the:
```ts
q => q.clickedOk
```
is short for 
```ts
q => { return q.clickedOk; }
```
:::