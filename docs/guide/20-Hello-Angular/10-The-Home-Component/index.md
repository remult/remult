
The first thing we see in the application, is the `HomeComponent` 

![](home-component.png)

let's review it's code.

In the file explorer (in the left of your editor), under the `src\app` directory you will find the `home` directory that has all the files that are related to the `HomeComponent`

![](home-component-file-structure.png)

The files are:


1. home.component.html - holds the html template for the component
2. home.component.scss - holds the css rules for the component
3. home.component.ts - holds the TypeScript business logic for the component.

## Changing the html
Let's open the `home.component.html` file and make the following change:
```ts
    <p>
-   home works!
+   Hello world!
    </p>
```

 while you do that, please look at your browser and see that it automatically refreshes whenever we change a file in the code. We have the Angular dev server to thank for that.




