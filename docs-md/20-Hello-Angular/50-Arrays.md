Arrays are easy to define in typescript and are very powerful. For those of you coming from C# it's a full blown powerful list.

Let's add a Friends array, to the 'home.component.ts' file
```csdiff
...
export class HomeComponent implements OnInit {

  constructor() { }
  person: Person = { name: 'Steve', age: 25 };
+ friends:Person[] = [];
  ngOnInit() {
  }
}
...
```
In this line we've defined a new `member` called `friends` - it's of Type `Person[]` (Person Array) = and we have initialized it with an empty Array (`[]`);

We can add Items to the Array

```csdiff
...
export class HomeComponent implements OnInit {

  constructor() { }
  person: Person = { name: 'Steve', age: 25 };
  friends:Person[] = [];
  ngOnInit() {
+   this.friends.push({name:'Rachel',age:45});
+   this.friends.push({name:'Ross',age:47});
  }
}
...
```
We can also initialize the Array with these items in one line:

```csdiff
...
export class HomeComponent implements OnInit {
  constructor() { }
  person: Person = { name: 'Steve', age: 25 };
- friends:Person[] = [];
+ friends:Person[] = [{name:'Rachel',age:45}, {name:'Ross',age:47}];
  ngOnInit() {
-   this.friends.push({name:'Rachel',age:45});
-   this.friends.push({name:'Ross',age:47});
  }
}
...
```

## Using Arrays in the Html Template using *ngFor
Let's display a list of Friends in our `home.component.html`

```csdiff
What is your name?
    <input [(ngModel)]="person.name">
    <p *ngIf="person.name.length>0">
    Hello {{person.name}}! you are {{person.age}} years old
    </p>
+   <h4>These are our friends ({{friends.length}})</h4>
+   <ul>
+   <li *ngFor="let f of friends">{{f.name}}, age: {{f.age}}</li>
+   </ul>
```
In line 6 we've added an `h4` html title tag, to display a title that will also include how many friends we have. In this case it'll show `These are our friends (2)`
By placing the `*ngFor` tag in the `li` html tag, we ask Angular to repeat the `li` tag for every item in the array (person in the friends array)
