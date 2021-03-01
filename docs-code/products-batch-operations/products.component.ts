import { Component, OnInit } from '@angular/core';
import { Context, NumberColumn, ServerFunction } from '@remult/core';
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
  @ServerFunction({ allowed: true })
  static async updatePriceOnServer(priceToUpdate: number, context?: Context) {
    let products = await context.for(Products).find();
    for (const p of products) {
      p.price.value += priceToUpdate;
      await p.save();
    }
  }
  async updatePrice() {
    await ProductsComponent.updatePriceOnServer(this.priceToUpdate.value);
    //let products = await this.context.for(Products).find();
    //for (const p of products) {
    //  p.price.value += this.priceToUpdate.value;
    //  await p.save();
    //}
    this.products.getRecords();
  }
}
