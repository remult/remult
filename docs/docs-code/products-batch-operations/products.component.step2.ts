import { Component, OnInit } from '@angular/core';
import { GridSettings } from '@remult/angular';
import { Remult } from 'remult';
import { Products } from './products';
@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  constructor(private remult: Remult) { }
  products = new GridSettings(this.remult.repo(Products), {
    allowCrud: true
  });
  ngOnInit(): void {
  }
  priceInput: string;
  async updatePrice() {
    for await (const p of this.remult.repo(Products).iterate()) {
      p.price += +this.priceInput;
      await p.save();
    }
    this.products.reloadData();
  }
}
