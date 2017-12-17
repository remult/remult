import { Input, Component } from '@angular/core';
import { GridSettings } from '../utils';
@Component({
  selector: 'select-popup',
  template: `

<!-- Modal -->
<div class="modal fade" *ngIf="settings && settings.popupSettings" id="{{settings.popupSettings.modalId}}" tabindex="-1"
  role="dialog" aria-labelledby="myModalLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <h4 class="modal-title" id="myModalLabel">{{settings.popupSettings.title}}</h4>
      </div>
      <div class="modal-body">
        <div class="row">
          
            <div>
              <div class="form-group">
                <label>Search</label>
                <input type="search" class="form-control" placeholder="{{settings.popupSettings.searchColumnCaption()}}" [(ngModel)]="settings.popupSettings.searchText"
                  (ngModelChange)="settings.popupSettings.search()">
              </div>
            </div>
            <data-grid [settings]="settings"></data-grid>
          </div>
        
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary" (click)="settings.popupSettings.modalSelect()">Select</button>
      </div>
    </div>
  </div>
</div>`

})
export class SelectPopupComponent {
  @Input() settings: GridSettings<any>;


  ngOnChanges(): void {

  }
}
