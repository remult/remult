
import { ColumnCollection, DataAreaSettings, dataAreaSettings, ColumnSetting } from '../../core/utils';

import { Component,  Input, ViewEncapsulation } from '@angular/core';
@Component({
  selector: 'data-area2',
  
  templateUrl:'./dataArea2.html',
  styleUrls:['./dataArea2.scss'],
  encapsulation:ViewEncapsulation.None
  
})
export class DataArea2Compnent  {
 
  @Input() settings: dataAreaSettings = { columns: new ColumnCollection(() => undefined, () => false, undefined, () => true),lines:[] };
  
}
