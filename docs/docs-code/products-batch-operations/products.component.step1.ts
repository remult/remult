import { Component, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { GridSettings } from '@remult/angular';
import { Products } from './products';
@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  constructor(private context: Context) { }
  products = new GridSettings(this.context.for(Products), {
    allowCrud: true
  });
  ngOnInit() {
  }
  priceInput: string;
  async updatePrice() {
  }
}
