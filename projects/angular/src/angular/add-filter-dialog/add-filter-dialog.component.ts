import { Component } from '@angular/core';



import { MatDialogRef } from '@angular/material/dialog';


@Component({
    templateUrl: './add-filter-dialog.component.html'
})
export class SelectValueDialogComponent {
    constructor(private dialog: MatDialogRef<any>) {


    }
    searchString = '';
    selectFirst() {
        for (const o of this.values) {
            if (this.matchesFilter(o)) {
                this.select(o);
                return;
            }
        }
    }
    matchesFilter(o: { caption?: string }) {
        return o.caption.toLocaleLowerCase().includes(this.searchString.toLocaleLowerCase());
    }

    /*internal*/
    values: { caption?: string }[];
    /*internal*/
    title: string;
    /*internal*/
    onSelect: (selected: { caption?: string }) => void;


    args<T extends { caption?: string }>(args: {
        values: T[],
        onSelect: (selected: T) => void
        title?: string
    }) {
        this.values = args.values;
        this.onSelect = args.onSelect;
        this.title = args.title;
    }

    select(x: { caption?: string }) {
        this.onSelect(x);
        this.dialog.close();
    }
}