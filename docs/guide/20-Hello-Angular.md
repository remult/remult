# Hello Angular

Now that we have the application running, we can start using Angular to our advantage.

In this section, I'll cover the very basic aspects of Angular - but this is by no means a complete Angular course, please review the [Further learning](further-learning.html) page for more training resources.

If you are already familiar with angular principles, please proceed to the next chapter

## The Home Component

The first thing we see in the application, is the `HomeComponent` 

![](home-component.png)

let's review it's code.

In the file explorer (in the left of your editor), under the `src\app` directory you will find the `home` directory that has all the files that are related to the `HomeComponent`

![](home-component-file-structure.png)

The files are:


1. home.component.html - holds the html template for the component
2. home.component.scss - holds the css rules for the component
3. home.component.ts - holds the TypeScript business logic for the component.

### Changing the html
Let's open the `home.component.html` file and make the following change:
```html{2}
<p>
   Hello world!
</p>
```

 while you do that, please look at your browser and see that it automatically refreshes whenever we change a file in the code. We have the Angular dev server to thank for that.




## Binding the html to data from the component

 Let's add a field in our component and use it from the html.

 In the `home.component.ts` add the `name` field:
 ```ts{11}
 import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }
  name = 'Steve';
  ngOnInit() {
  }
}
```

Now we can use the `name` field in the `home.component.html` file
```html{2}
<p>
    Hello {{name}}!
</p>
```

Within the curly brackets, we can write any typescript code and it'll work, for example if we'll write `{{ 1 + 1}}` it'll write 2 in the html.

## Getting input from the user
Let's add the following line to the `home.component.html` file:
```html{1-2}
What is your name? 
<input [(ngModel)]="name">
<p>
    Hello {{name}}!
</p>
```
We've added the html `input` tag - and in it we've added the following code `[(ngModel)]="name"` which tells Angular to bind the data from the input, to the `name` field.
Whenever the user will type a value in the `input` html element - the page will recompute to reflect that change.

For example, type in your name in the `input` and you'll be gritted with hello.

::: tip
 because we've installed the `angular2-switcher` we can now switch between the `home.component.ts` to the `home.component.html` file easily by pressing <kbd>alt</kbd> + <kbd>O</kbd>. See [angular2-switcher](https://marketplace.visualstudio.com/items?itemName=infinity1207.angular2-switcher) for more shortcuts.
:::

## using If logic in the Html Template *ngIf
Now, we want to make sure that we only greet someone with a name, meaning that if you don't type any value in the `input` we don't won't to write the `Hello ` statement.
We'll do that using Angular's `*ngIf` tag

```html{3}
What is your name? 
<input [(ngModel)]="name">
<p *ngIf="name.length>0">
    Hello {{name}}!
</p>
```

By placing the `*ngIf` tag in the `<p>` html element - we've got angular to only write the `<p>` section (and all it's content) into the html if the condition we specified is met.

## Data Structures

instead of just using fields, we can use a data structure that we define. In typescript, it's called an `interface`

In the `home.component.ts` file, add the following code:
```ts{16-19}
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }
  name='Steve';
  ngOnInit() {
  }
}

export interface Person{
  name:string;
  age?:number;
}
```

1. We've created an `inteface` with the name of `Person`
2. this interface will have two members:
    1. name of type string - the structure in typescript is member name, colon (:) and the member type.
    2. age of type number, which is optional (the question mark indicates that this is an optional field)
3. By adding the `export` keyword before the `interface` we've indicated that we might use this interface elsewhere in the application.

Now let's use our new interface with it's two members.

In the `home.component.ts` file
```ts{10}
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  constructor() { }
  person: Person = { name: 'Steve', age: 25 };
  ngOnInit() {
  }
}
export interface Person {
  name: string;
  age?: number;
} 
```

In the `home.component.html` file:
```html
What is your name?
<input [(ngModel)]="person.name">
<p *ngIf="person.name.length>0">
  Hello {{person.name}}! you are {{person.age}} years old
</p>
```
> Yes I know I don't input the age, for now let's assume everyone is 25 - or you can do that as an exercise

## Arrays
Arrays are easy to define in typescript and are very powerful. For those of you coming from C# it's a full blown powerful list.

Let's add a Friends array, to the 'home.component.ts' file
```ts{4}
export class HomeComponent implements OnInit {
  constructor() { }
  person: Person = { name: 'Steve', age: 25 };
  friends:Person[] = [];
  ngOnInit() {
  }
}
```
In this line we've defined a new `member` called `friends` - it's of Type `Person[]` (Person Array) = and we have initialized it with an empty Array (`[]`);

We can add Items to the Array

```ts{6-7}
export class HomeComponent implements OnInit {
  constructor() { }
  person: Person = { name: 'Steve', age: 25 };
  friends:Person[] = [];
  ngOnInit() {
    this.friends.push({name:'Rachel',age:45});
    this.friends.push({name:'Ross',age:47});
  }
}
```
We can also initialize the Array with these items in one line:

```ts{4}
export class HomeComponent implements OnInit {
  constructor() { }
  person: Person = { name: 'Steve', age: 25 };
  friends:Person[] = [{name:'Rachel',age:45}, {name:'Ross',age:47}];
  ngOnInit() {
  }
}
```

## Using Arrays in the Html Template using *ngFor
Let's display a list of Friends in our `home.component.html`

```html{4-9}
What is your name?
<input [(ngModel)]="person.name">
<p *ngIf="person.name.length>0">
Hello {{person.name}}! you are {{person.age}} years old
</p>
<h4>These are our friends ({{friends.length}})</h4>
<ul>
    <li *ngFor="let f of friends">{{f.name}}, age: {{f.age}}</li>
</ul>
```
In line 6 we've added an `h4` html title tag, to display a title that will also include how many friends we have. In this case it'll show `These are our friends (2)`
By placing the `*ngFor` tag in the `li` html tag, we ask Angular to repeat the `li` tag for every item in the array (person in the friends array)

## Adding a butting with a Click event
Now, I want the user to be able to add a friend to the list.

First, in the `home.component.ts` let's add the `addFriend` method
```ts {7-10}
export class HomeComponent implements OnInit {
  constructor() { }
  person: Person = { name: 'Steve', age: 25 };
  friends: Person[] = [{ name: 'Rachel', age: 45 }, { name: 'Ross', age: 47 }];
  ngOnInit() {
  }
  addFriend() {
    this.friends.push(this.person); // add the person to the friends array
    this.person = { name: 'new friend', age: 25 }; //init the person field
  }
}
```

And now let's call it from the `home.component.html` template
```html{6}
    What is your name?
    <input [(ngModel)]="person.name">
    <p *ngIf="person.name.length>0">
    Hello {{person.name}}! you are {{person.age}} years old
    </p>
    <button (click)="addFriend()" >Add {{person.name}} as a friend</button>
    <h4>These are our friends ({{friends.length}})</h4>
    <ul>
    <li *ngFor="let f of friends">{{f.name}}, age: {{f.age}}</li>
    </ul>
```

We've added a button, and in it's `(click)` event we call the `addFriend` method we've defined in the `home.component.ts`