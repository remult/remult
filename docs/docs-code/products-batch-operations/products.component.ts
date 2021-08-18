import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { BackendMethod, Remult } from 'remult';
import { Products } from './products';
@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  constructor(private remult: Remult) { }
  products = new GridSettings(this.remult.for(Products), {
    allowCrud: true
  });
  ngOnInit(): void {
  }
  priceInput: string;
  async updatePrice() {
    await ProductsComponent.updatePriceOnBackend(Number.parseInt(this.priceInput));
    // for await (const p of this.remult.for(Products).iterate()) {
    //   p.price += Number.parseInt(this.priceInput);
    //   await p.save();
    // }
    this.products.reloadData();
  }
  @BackendMethod({ allowed: true })
  static async updatePriceOnBackend(priceToUpdate: number, remult?: Remult) {
    for await (const p of remult.for(Products).iterate()) {
      p.price += priceToUpdate
      await p.save();
    }
  }
}
