
import { Component, OnChanges, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { Column } from '../../column';
import { Entity } from '../../entity';
import { GridSettings, RowButton, GridButton } from '../../grid-settings';
import { DataControlSettings } from '../../column-interfaces';
import { isFunction } from 'util';
import { DataFilterInfoComponent } from '../data-filter-info/data-filter-info.component';
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
  getColFlex(map: DataControlSettings) {
    return '0 0 ' + this.getColWidth(map);
  }
  getColWidth(map: DataControlSettings) {
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
  tempDragColumn: (DataControlSettings);
  dragStart(x: DataControlSettings) {
    this.tempDragColumn = x;

  }
  dragOver(x: Column, event: any) {
    event.preventDefault();
  }
  onDrop(x: DataControlSettings) {
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
  isFiltered(c: Column) {
    return this.settings.columns.filterHelper.isFiltered(c);
  }
  @ViewChild(DataFilterInfoComponent) dataFilterInfo: DataFilterInfoComponent;
  showFilterColumnDialog(dataControlSettings: DataControlSettings) {
    this.settings.initOrigList();
    this.dataFilterInfo.editFilter(dataControlSettings.column);
  }

  getButtonCssClass(b: RowButton<any>, row: any) {
    if (!b.cssClass)
      return "";
    if (isFunction(b.cssClass))
      return (<((row: any) => string)>b.cssClass)(row);
    return b.cssClass.toString();

  }
  hasVisibleButton(record) {
    return this.rowButtons.find(b => b.visible(record));
  }
  hasVisibleGridButtons() {
    return this.gridButtons.find(b => b.visible());
  }
  rowButtons: RowButton<any>[] = [];
  gridButtons: GridButton[] = [];
  keys: string[] = [];
  private addButton(b: RowButton<Entity>) {
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

  catchErrors(what: any, r: Entity) {
    what.catch((e: any) => {
      this.showError(r);

    });


  }
  private showError(row: Entity) {
    let message = row.validationError;
    if (!message)
      message = "";
    let foundStateErrors = false;
    for (const c of row.columns) {
      if (c.validationError) {
        if (!foundStateErrors) {
          foundStateErrors = true;
          message = "";
        }
        let m = c.defs.caption + ": ";
        m += c.validationError;
        message += m + "\n";
      }
    }
    alert(message);
  }



  ngOnChanges(): void {

    if (!this.settings)
      return;


    this.rowButtons = [];
    this.gridButtons = [];
    this.gridButtons.push({
      visible: () => this.settings.items.find(x => x.wasChanged()),
      textInMenu: () => this.rightToLeft ? ('שמור ' + this.settings.items.filter(x => x.wasChanged()).length + ' שורות') :
        ('save ' + this.settings.items.filter(x => x.wasChanged()).length + ' rows'),
      click: async () => {
        await Promise.all(this.settings.items.filter(x => x.wasChanged()).map(x => x.save()));
      }
    });
    if (this.settings.settings.gridButtons) {
      this.gridButtons.push(...this.settings.settings.gridButtons.map(x => {
        if (!x.visible)
          x.visible = () => true;
        return x;
      }));
    }

    if (this.settings.allowUpdate) {
      this.addButton({
        name: "",
        icon: 'check',
        cssClass: "glyphicon glyphicon-ok btn-success",
        visible: r => r.wasChanged(),
        showInLine: true,
        textInMenu: () => this.rightToLeft ? 'שמור' : 'save',
        click: r => {
          this.catchErrors(this.settings._doSavingRow(r), r);
        },

      });
      this.addButton({
        name: "",
        icon: 'cancel',
        cssClass: "btn btn-danger glyphicon glyphicon-ban-circle",
        visible: r => r.wasChanged(),
        showInLine: true,
        textInMenu: () => this.rightToLeft ? 'בטל שינוים' : 'cancel',

        click: r => {
          r.undoChanges();
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
        showInLine: true,
        textInMenu: () => this.rightToLeft ? 'מחק' : 'delete',
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
