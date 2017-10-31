import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],

})
export class AppComponent {
  title = 'app';
  anotherTitle = 'noam';
  doSomething() {
    alert('noam the red');

  }
  constructor() {
      this.title = "123";
  }
}
