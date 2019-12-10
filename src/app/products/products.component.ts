import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction } from '@remult/core';
import { Products } from './products';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {

  constructor(private context: Context) { }
  products = this.context.for(Products).gridSettings({});

  ngOnInit() {
  }
  async test(){
    await ProductsComponent.testIt();
  }
  @ServerFunction({ allowed: true })
  static testIt() {
    console.log('testing');
  }

}
