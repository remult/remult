import { Component, OnInit } from '@angular/core';
import { Context, NumberColumn } from '@remult/core';
import { Products } from './products';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  constructor(private context: Context) { }
  products = this.context.for(Products).gridSettings({
    allowCRUD: true
  });
  ngOnInit() {
  }
  priceToUpdate = new NumberColumn('Price to Update');
  async updatePrice() {
  }
}
