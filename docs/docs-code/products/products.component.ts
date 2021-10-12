import { Component, OnInit } from '@angular/core';
import { Remult } from 'remult';
import { GridSettings } from '@remult/angular';
import { Product } from './product';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  constructor(private remult: Remult) { }
  products = new GridSettings(this.remult.repo(Product), {
    allowCrud: true
  });
  ngOnInit() {
  }
}