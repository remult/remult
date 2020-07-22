
instead of just using fields, we can use a data structure that we define. In typescript, it's called an `interface`

In the `home.component.ts` file, add the following code:
```ts
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

+export interface Person{
+  name:string;
+  age?:number;
+}
```

1. We've created an `inteface` with the name of `Person`
2. this interface will have two members:
    1. name of type string - the structure in typescript is member name, colon (:) and the member type.
    2. age of type number, which is optional (the question mark indicates that this is an optional field)
3. By adding the `export` keyword before the `interface` we've indicated that we might use this interface elsewhere in the application.

Now let's use our new interface with it's two members.

In the `home.component.ts` file
```ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }
- name='Steve';
+ person: Person = { name: 'Steve', age: 25 };
  ngOnInit() {
  }
}
export interface Person {
  name: string;
  age?: number;
} 
```

In the `home.component.html` file:
```ts
What is your name?
- <input [(ngModel)]="name">
+ <input [(ngModel)]="person.name">

- <p *ngIf="name.length>0">
+ <p *ngIf="person.name.length>0">

- Hello {{name}}!
+ Hello {{person.name}}! you are {{person.age}} years old
 </p>
```
> Yes I know I don't input the age, for now let's assume everyone is 25 - or you can do that as an exercise
