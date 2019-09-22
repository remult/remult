import { Component, OnInit } from '@angular/core';
import { RunOnServer } from 'radweb';
import { Context } from 'radweb';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  clickMe() {
    HomeComponent.test();
  }
  @RunOnServer({ allowed: () => true })
  static test(context?: Context) {
    console.log('hi');
    console.log(context.user);
  }
}

