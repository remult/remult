import { Component, OnInit } from '@angular/core';
import { ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-wait',
  templateUrl: './wait.component.html',
  styleUrls: ['./wait.component.scss']
})
export class WaitComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }
  mode:ProgressSpinnerMode =  'indeterminate';
  value = 0;
}
