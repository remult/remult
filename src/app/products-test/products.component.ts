import { Component, OnInit } from '@angular/core';
import { Context, iterateConfig, Column, getControllerDefs, EntityColumns } from '@remult/core';

import { Products } from './products';
import { DialogConfig, GridSettings, InputControl, openDialog } from '@remult/angular';
import { DataAreaSettings, DataControl } from '@remult/angular';
import { DataControlSettings } from '../../../dist/angular';
import { Users } from '../../../projects/angular/schematics/hello/files/src/app/users/users';








@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height: '1500px'

})
export class ProductsComponent implements OnInit {

  

  constructor(private context: Context) { }
  async ngOnInit() {
    let u =await  this.context.for(Users).findFirst();
    u.admin = true;
    await u._.save();



  }



}





