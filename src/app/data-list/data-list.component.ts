
import { Component, OnInit } from '@angular/core';
import * as utils from './../../utils/utils';
import * as models from './../models';

@Component({
  selector: 'app-root',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.css']
})
export class DataListComponent implements OnInit {
  page = 1;
  constructor() { }
  settings = new utils.GridSettings(new models.Orders());
  orders = new utils.DataList(new models.Orders(), );
  ngOnInit() {
    this.orders.get({ orderBy: o => new utils.Sort({ column: o.customerID }) });
  }
  addPage() {
    this.page++;
    this.orders.get({
      page: this.page });
  }
  save(order: models.Orders) { 
    
    order.save();

  } 
  

}
