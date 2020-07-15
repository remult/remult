import { Component, OnInit } from '@angular/core';
import { Context, ServerFunction, SqlDatabase, DialogConfig, packWhere, BoolColumn, StringColumn, DataAreaSettings, DateColumn } from '@remult/core';
import { Products, productStatus } from './products';
import { YesNoQuestionComponent } from '../../../projects/core/schematics/hello/files/src/app/common/yes-no-question/yes-no-question.component';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
@DialogConfig({
  height: '1500px'

})
export class ProductsComponent implements OnInit {

  col = new DateColumn({
    caption: 'name',
    dataControlSettings: () => ({
      readOnly: true
    })
  });
  click(){
    throw 'err';
  }
  
  
  

  getWhere() {

    return JSON.stringify(packWhere(this.products.filterHelper.filterRow, this.products.getFilterWithSelectedRows().where));
  }
  constructor(private context: Context) {


  }
  area = new DataAreaSettings();

  products = this.context.for(Products).gridSettings({
    allowUpdate: true,
    allowInsert: true,
    allowSelection: true,
    knowTotalRows: true,
    columnSettings:p=>[
      p.name,
      {
        column:p.name,
        valueList:['a','b']
      }
    ],


    onEnterRow: (r) => {
      this.area = new DataAreaSettings({ columnSettings: () => [this.col, r.phone] });
    },
    get: {
      
    },
    gridButtons: [
      {
        name: 'xxx'
      }
    ],
    rowButtons:[
      {
        icon:'clear',
        textInMenu:()=>'asdf',
        showInLine:true
      }
    ]

  });

  ngOnInit() {
    
  }
  async test() {
    await ProductsComponent.testIt(2);
  }

  async dialog() {
    throw 'ee';
    this.context.openDialog(YesNoQuestionComponent,x=>x.args={
      message:'123'
      
    });
  }
  @ServerFunction({ allowed: true })
  static async testIt(amount: Number, context?: Context) {
    console.log(context);
    throw "it didn't work";
    //console.log((await sql.createCommand().execute("select 1 as a,2 as b,3 as c")).rows[0]);
  }

}
