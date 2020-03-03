import { Component } from '@angular/core';
import { DataFilterInfoComponent } from '../data-filter-info/data-filter-info.component';
import { DataControlSettings } from '@remult/core';
import { MatDialogRef } from '@angular/material';


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