import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-test',
  template: `
   <select matNativeControl class="form-control" #lang (change)="refreshBaskets()" [(ngModel)]="filterGroup">

<option *ngFor="let g of groups" [value]="g.name">{{g.name}} - {{g.familiesCount}}
</option>
</select>
{{filterGroup|json}}`,
  styleUrls: ['./test.component.scss']
})
export class TestComponent {
  filterGroup: string = '';
  groups: { familiesCount: number, name: string }[];
  refreshBaskets() {
    // if (!this.groups)
    this.groups = [
      { name: '', familiesCount: 1 },
      { name: 'a', familiesCount: 1 },
      { name: 'b', familiesCount: 1 }
    ]
  }
  async ngOnInit() {
    this.refreshBaskets();
  }

}