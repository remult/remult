import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserInfo, remult } from 'remult';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TodoComponent } from '../todo/todo.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, TodoComponent, HttpClientModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
})
export class AuthComponent implements OnInit {
  constructor(private http: HttpClient) {}

  signInUsername = '';
  remult = remult;

  signIn() {
    this.http
      .post<UserInfo>('/api/signIn', {
        username: this.signInUsername,
      })
      .subscribe({
        next: (user) => {
          this.remult.user = user;
          this.signInUsername = '';
        },
        error: (error) => alert(error.error),
      });
  }

  signOut() {
    this.http
      .post('/api/signOut', {})
      .subscribe(() => (this.remult.user = undefined));
  }

  ngOnInit() {
    this.http
      .get<UserInfo>('/api/currentUser')
      .subscribe((user) => (this.remult.user = user));
  }
}
