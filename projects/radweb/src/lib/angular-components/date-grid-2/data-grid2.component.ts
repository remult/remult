import { GridSettings, RowButton, isNewRow, Column, Entity, ColumnSetting } from '../../core/utils';
import { Component, OnChanges, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { isFunction } from '../../core/common';
@Component({
  selector: 'data-grid',
  templateUrl: `./data-grid2.component.html`,
  styleUrls: ['./data-grid2.component.scss']
}
)



export class DataGrid2Component implements OnChanges, AfterViewInit {
  ngAfterViewInit(): void {
    if (window && window.getComputedStyle && this.dataGridDiv) {
      this.rightToLeft = window.getComputedStyle(this.dataGridDiv.nativeElement, null).getPropertyValue('direction') == 'rtl';


    }
  }
  getColFlex(map: ColumnSetting<any>) {
    return '0 0 ' + this.getColWidth(map);
  }
  getColWidth(map: ColumnSetting<any>) {
    let x = this.settings.columns.__dataControlStyle(map);
    if (!x)
      x = '200px';
    return x;
  }

  test() {
    //this.dataGridDiv.nativeElement.scrollTop = 0;
  }
  rightToLeft = false;
  //@ts-ignore
  @ViewChild('dataGridDiv')
  dataGridDiv: ElementRef;
  getTotalRows() {
    if (this.settings.totalRows)
      return Math.ceil(this.settings.totalRows / this.settings.rowsPerPage);
    if (this.rightToLeft)
      return 'רבים';
    return 'many';
  }
  tempDragColumn: Column<any>;
  dragStart(x: Column<any>) {
    this.tempDragColumn = x;

  }
  dragOver(x: Column<any>, event: any) {
    event.preventDefault();
  }
  onDrop(x: Column<any>) {
    let oldPosition = this.settings.columns.items.indexOf(this.tempDragColumn);
    this.settings.columns.items.splice(oldPosition, 1);
    let newPosition = this.settings.columns.items.indexOf(x);
    if (newPosition == oldPosition)
      newPosition++;
    this.settings.columns.items.splice(newPosition, 0, this.tempDragColumn);
    this.settings.columns.colListChanged();
  }
  @Input() width: string;
  @Input() height: string;
  _getHeight() {
    if (this.height) {
      if ((+this.height).toString() == this.height)
        return this.height + "px";
      return this.height;
    }
  }
  @Input() displayButtons = true;
  @Input() displayVCR = true;

  @Input() records: any;
  @Input() settings: GridSettings<any>;
  isFiltered(c: Column<any>) {
    return this.settings.columns.filterHelper.isFiltered(c);
  }

  getButtonCssClass(b: RowButton<any>, row: any) {
    if (!b.cssClass)
      return "";
    if (isFunction(b.cssClass))
      return (<((row: any) => string)>b.cssClass)(row);
    return b.cssClass.toString();

  }

  rowButtons: RowButton<any>[] = [];
  keys: string[] = [];
  private addButton(b: RowButton<any>) {
    if (!b.click)
      b.click = (r) => { };
    if (!b.visible)
      b.visible = r => true;
    if (!b.cssClass)
      b.cssClass = r => "btn";
    else if (!isFunction(b.cssClass)) {
      let x = b.cssClass;
      b.cssClass = <any>((r: any) => x);
    }

    this.rowButtons.push(b);
    return b;

  }
  rowClicked(row: any) {
    this.settings.setCurrentRow(row);
  }

  page = 1;
  nextPage() {
    this.page++;
  }
  previousPage() {
    if (this.page <= 1)
      return;
    this.page--;
  }

  catchErrors(what: any, r: Entity<any>) {
    what.catch((e: any) => {
      this.showError(r);

    });


  }
  private showError(row: Entity<any>) {
    let message = row.error;
    if (!message)
      message = "";
    let foundStateErrors = false;
    row.__iterateColumns().forEach(c => {
      if (c.error) {
        if (!foundStateErrors) {
          foundStateErrors = true;
          message = "";
        }
        let m = c.caption + ": ";
        m += c.error;
        message += m + "\n";
      }
    });
    alert(message);
  }



  ngOnChanges(): void {

    if (!this.settings)
      return;


    this.rowButtons = [];
    if (this.settings.allowUpdate) {
      this.addButton({
        name: "",
        icon: 'check',
        cssClass: "glyphicon glyphicon-ok btn-success",
        visible: r => r.wasChanged(),
        click: r => {
          this.catchErrors(this.settings._doSavingRow(r), r);
        },

      });
      this.addButton({
        name: "",
        icon: 'cancel',
        cssClass: "btn btn-danger glyphicon glyphicon-ban-circle",
        visible: r => r.wasChanged(),
        click: r => {
          r.reset();
        }
      });


    }
    if (this.settings.allowDelete)
      this.addButton({
        name: '',
        visible: (r) => {
          return r && !r.isNew();
        }
        , icon: 'delete',
        click: r => {
          if (this.settings.setCurrentRow && this.settings.settings.confirmDelete) {
            this.settings.settings.confirmDelete(r, () => this.catchErrors(r.delete(), r));
          }
          else
            this.catchErrors(r.delete(), r);

        },

        cssClass: "btn-danger glyphicon glyphicon-trash"
      });
    if (this.settings._buttons)
      for (let b of this.settings._buttons) {
        this.addButton(b);
      }
    if (!this.records && this.settings) {
      this.settings.getRecords().then((r: any) => {
        this.records = r;

      });

    }

  }

  _getRowClass(row: any) {
    let r = 'dataGridRow ';
    if (this.settings.rowClass)
      r += this.settings.rowClass(row);
    if (row == this.settings.currentRow)
      r += " active";

    return r;
  }
  _getRowColumnClass(col: any, row: any) {
    return this.settings.columns._getColumnClass(col, row) + ' dataGridDataCell';
  }


}
