import { Component, OnInit } from '@angular/core';
import { Context, NumberColumn } from '@remult/core';
import { Products } from './products';
import { GridSettings } from '@remult/angular';
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
  priceToUpdate = new NumberColumn({ caption: 'Price to Update' });
  async updatePrice() {
    for await (const p of this.context.for(Products).iterate()) {
      p.price.value += this.priceToUpdate.value;
      await p.save();
    }
    this.products.reloadData();
  }
}
