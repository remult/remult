import { Component, OnInit } from '@angular/core';
import { Remult } from 'remult';
import { GridSettings } from '@remult/angular';
import { Products } from './products';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  constructor(private context: Remult) { }
  products = new GridSettings(this.context.for(Products), {
    allowCrud: true
  });
  ngOnInit() {
  }
}