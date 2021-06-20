import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { Context } from '@remult/core';
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
  ngOnInit(): void {
  }
  priceInput: string;
  async updatePrice() {
    for await (const p of this.context.for(Products).iterate()) {
      p.price += +this.priceInput;
      await p.save();
    }
    this.products.reloadData();
  }
}
