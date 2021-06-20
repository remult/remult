import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { Context, ServerFunction } from '@remult/core';
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
    await ProductsComponent.updatePriceOnServer(Number.parseInt(this.priceInput));
    // for await (const p of this.context.for(Products).iterate()) {
    //   p.price += Number.parseInt(this.priceInput);
    //   await p.save();
    // }
    this.products.reloadData();
  }
  @ServerFunction({ allowed: true })
  static async updatePriceOnServer(priceToUpdate: number, context?: Context) {
    for await (const p of context.for(Products).iterate()) {
      p.price += priceToUpdate
      await p.save();
    }
  }
}
