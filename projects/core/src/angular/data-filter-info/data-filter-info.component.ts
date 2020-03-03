
import { Component, Input, ElementRef, ViewChild } from '@angular/core';
import { Column } from '../../column';
import { GridSettings } from '../../grid-settings';
import { DataControlSettings } from '../../column-interfaces';
import { Context } from '../../context';
import { AddFilterDialogComponent } from '../add-filter-dialog/add-filter-dialog.component';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
@Component({
    selector: 'Data-Filter',
    templateUrl: './data-filter-info.component.html',
    styles: [`.link {
        cursor:pointer;
        color:blue;
        text-decoration:underline;
   }`]
})
export class DataFilterInfoComponent {

    @Input() settings: GridSettings<any>;
    filterColumnToAdd: DataControlSettings<any>;
    getCurrentFilterValue(col: Column<any>) {
        let m = this.settings.origList.find(x => x.column == col);
        return this.settings.columns._getColDisplayValue(m, this.settings.filterHelper.filterRow);
    }
    cancelAddFilter() {



    }
    constructor(private context: Context) {

    }

    showFilterButton = false;
    showAddFilter = false;
    editFilterVisible = false;
    showEditFilter(col: Column<any>) {
        this.filterColumnToAdd = this.settings.origList.find(x => x.column == col);
        this.editFilterVisible = true;
        this.showAddFilter = false;
    }
    userFilterButton() {
        this.showFilterButton = !this.showFilterButton;
        this.settings.initOrigList();
        if (this.settings.filterHelper.filterColumns.length == 0)
            this.showAddAnotherFilterDialog();
    }
    async showAddAnotherFilterDialog() {
        this.settings.initOrigList();
        this.filterColumnToAdd = undefined;
        await this.context.openDialog(AddFilterDialogComponent, x => x.info = this);
        if (this.filterColumnToAdd) {
            await this.context.openDialog(FilterDialogComponent, x => x.info = this);
        }

        this.showAddFilter = true;
        this.filterColumnToAdd = undefined;
    }
    async editFilter(col: Column<any>) {
        this.filterColumnToAdd = this.settings.origList.find(x => x.column == col);
        await this.context.openDialog(FilterDialogComponent, x => x.info = this);
    }
    confirmEditFilter() {
        this.settings.columns.filterRows(this.filterColumnToAdd);
        this.editFilterVisible = false;
    }
    clearEditFilter() {
        this.settings.columns.clearFilter(this.filterColumnToAdd);
        this.editFilterVisible = false;
    }


    addFilter() {

        this.settings.columns.filterRows(this.filterColumnToAdd);
        this.showAddFilter = false;
    }
    cancelAddNewFilter() {
        this.showAddFilter = false;
    }
    rightToLeft = false;
    //@ts-ignore
    @ViewChild('theDiv')
    theDiv: ElementRef;
    ngAfterViewInit(): void {
        if (window && window.getComputedStyle && this.theDiv) {
            this.rightToLeft = window.getComputedStyle(this.theDiv.nativeElement, null).getPropertyValue('direction') == 'rtl';
        }
    }
}
