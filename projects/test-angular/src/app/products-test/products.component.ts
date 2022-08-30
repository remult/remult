import { AfterViewInit, ChangeDetectionStrategy, Component, ComponentFactoryResolver, Input, NgZone, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Remult, Field, Entity, EntityBase, BackendMethod, getFields, IdEntity, isBackend, Fields, Controller, Filter, FieldRef } from 'remult';

import { CustomDataComponent, DataAreaSettings, DataControlSettings, getEntityValueList, GridSettings, InputField } from '@remult/angular/interfaces';

import { DialogConfig } from '../../../../angular';
import { RemultAngularPluginsService } from '../../../../angular/src/angular/RemultAngularPluginsService';
import axios, { Axios } from 'axios';


@Controller("blabla")

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
  //,changeDetection: ChangeDetectionStrategy.OnPush
})
@DialogConfig({
  height: '1500px'
})
export class ProductsComponent implements OnInit {
  page = 0;
  constructor(private remult: Remult, plugin: RemultAngularPluginsService, private componentFactoryResolver: ComponentFactoryResolver) {
    plugin.dataControlAugmenter = (f, s) => {
      if (f.options.aha)
        s.click = () => alert("aha");
    }
  }

  @ViewChild('theId', { read: ViewContainerRef, static: true }) theId: ViewContainerRef;

  grid = new GridSettings(this.remult.repo(stam), {
    allowCrud: true,
   
     });
  area: DataAreaSettings;
  field: FieldRef<any, any>;
  async ngOnInit() {
   

  }
  async click() {

  }

}


@Entity<stam>('stam', {
  allowApiCrud: true,

})
export class stam extends IdEntity {
  @Fields.string({ dbName: 'name', aha: true })
  name: string;
  @Fields.dateOnly({ allowNull: true })
  stamDate?: Date

  @Fields.string({ serverExpression: () => 'noam' })
  test: string = '';


  @BackendMethod({ allowed: false })
  static async staticBackendMethod(remult?: Remult) {

  }
  @BackendMethod({ allowed: true })
  async entityBackendMethod() {

  }
}

export class controllerWithStaic {
  @BackendMethod({ allowed: true })
  static staticControllerMethod() {

  }
}
@Controller("controllerWithInstance")
export class controllerWithInstance {
  @BackendMethod({ allowed: true })
   InstanceControllerMethod() {

  }
}

declare module 'remult' {
  export interface FieldOptions {
    aha?: boolean
  }
}



@Component({
  selector: 'app-a',
  template: `Component({{args?.fieldRef?.metadata?.caption}}) <input *ngIf="args?.fieldRef" [(ngModel)]="args.fieldRef.inputValue" >`,
})
export class AComponent implements CustomDataComponent {
  @Input()
  args: { fieldRef: FieldRef<any, any>; settings: DataControlSettings<any, any> };

}


@Component({
  selector: 'app-b',
  template: `Component b`,
})
export class BComponent { }
