import { Component } from '@angular/core';
import { DataFilterInfoComponent } from '../data-filter-info/data-filter-info.component';

import { MatDialogRef } from '@angular/material';
import { DataControlSettings } from '../../column-interfaces';


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