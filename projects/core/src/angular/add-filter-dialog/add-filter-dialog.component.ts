import { Component } from '@angular/core';
import { DataFilterInfoComponent } from '../data-filter-info/data-filter-info.component';


import { DataControlSettings } from '../../column-interfaces';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
    templateUrl: './add-filter-dialog.component.html'
})
export class AddFilterDialogComponent {
    constructor(private dialog:MatDialogRef<any>) {

    }
    info: DataFilterInfoComponent;
    select(x: DataControlSettings<any>) {
        this.info.filterColumnToAdd = x;
        this.dialog.close();
    }
}