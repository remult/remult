import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { remult } from 'remult';
import { TodoComponent } from './todo/todo.component.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TodoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'remult-angular-todo';

  constructor(zone: NgZone) {
    remult.apiClient.wrapMessageHandling = (handler) =>
      zone.run(() => handler());
  }
}
