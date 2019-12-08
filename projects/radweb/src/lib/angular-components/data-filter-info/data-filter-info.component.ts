
import { Component, Input } from '@angular/core';
import { Column } from '../../core/column';
import { GridSettings } from '../../core/gridSettings';
import { ColumnSetting } from '../../core/dataInterfaces1';
@Component({
    selector: 'Data-Filter',
    templateUrl:'./data-filter-info.component.html'
})
export class DataFilterInfoComponent {

    @Input() settings: GridSettings<any>;
    filterColumnToAdd: ColumnSetting<any>;
    getCurrentFilterValue(col: Column<any>) {
        let m = this.settings.origList.find(x => x.column == col);
        return this.settings.columns._getColDisplayValue(m, this.settings.filterHelper.filterRow);
    }
    cancelAddFilter() {

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
    showAddAnotherFilterDialog() {
        this.showAddFilter = true;
        this.filterColumnToAdd = undefined;
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
}