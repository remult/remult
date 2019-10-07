
 Let's add a field in our component and use it from the html.

 In the `home.component.ts` add the `name` field:
 ```csdiff
 import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }
+ name = 'Steve';
  ngOnInit() {
  }
}
```

Now we can use the `name` field in the `home.component.html` file
```csdiff
    <p>
-   Hello world!
+   Hello {{name}}!
    </p>
```

Within the curly brackets, we can write any typescript code and it'll work, for example if we'll write `{{ 1 + 1}}` it'll write 2 in the html.

