Now, I want the user to be able to add a friend to the list.

First, in the `home.component.ts` let's add the `addFriend` method
```csdiff
export class HomeComponent implements OnInit {
  constructor() { }
  person: Person = { name: 'Steve', age: 25 };
  friends: Person[] = [{ name: 'Rachel', age: 45 }, { name: 'Ross', age: 47 }];
  ngOnInit() {
  }
+ addFriend() {
+   this.friends.push(this.person); // add the person to the friends array
+   this.person = { name: 'new friend', age: 25 }; //init the person field
+ }
}
```

And now let's call it from the `home.component.html` template
```csdiff
    What is your name?
    <input [(ngModel)]="person.name">
    <p *ngIf="person.name.length>0">
    Hello {{person.name}}! you are {{person.age}} years old
    </p>
+   <button (click)="addFriend()" >Add {{person.name}} as a friend</button>
    <h4>These are our friends ({{friends.length}})</h4>
    <ul>
    <li *ngFor="let f of friends">{{f.name}}, age: {{f.age}}</li>
    </ul>
```

We've added a button, and in it's `(click)` event we call the `addFriend` method we've defined in the `home.component.ts`