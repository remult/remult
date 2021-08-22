# Grid Settings and Data-Grid

These objects are used to display an editable grid based on an entity.

They are designed with the goal of creating "admin" screens effortlessly.

To add a data grid to our controller, we'll let the remult create a GridSettings object.
```ts
export class ProductsComponent implements OnInit {
  constructor(private remult: Remult) { }
  products = new GridSettings(this.remult.repo(Products));
```
And in the `html` refer to the `gridSettings` object
```html
<data-grid [settings]="products"></data-grid>
```

We can configure the data grid by sending an options object to the `gridSettings` method.

<<< @/docs-code/products/products.component.ts{11-15} 



## Controlling which columns are displayed on the grid
By default the grid will display the first 5 columns that are defined in the entity.

We can control which columns to display in the grid, by setting the `columnSettings` property
for example:
```ts{2-5}
products = new GridSettings(this.remult.repo(Products),{
    columnSettings: p => [
      p.name,
      p.price
    ]
  });
```
::: tip
if you want to display more than 5 columns, set the `numOfColumnsInGrid` options property
:::

## Configuring the columns
You can control the way a column is displayed on the grid, by sending a using the [DataControlSettings](https://remult-ts.github.io/guide/ref_datacontrolsettings) object in the column's place:
```ts{2-9}
  products = this.remult.repo(Products).gridSettings({
    columnSettings: p => [
      p.name,
      {
        column: p.price,
        readOnly:true,
        width:'100'
      }
    ]
});
```

Explore the [DataControlSettings](https://remult-ts.github.io/guide/ref_datacontrolsettings) object for more options for displaying a column

## Adding buttons to the grid
You can configure several types of buttons for the grid.

## Row Buttons
These buttons appear for each row in the grid, they can appear both as buttons that appear on the grid, and as entries in a row level buttons.
```ts{2-11}
  products = new GridSettings(this.remult.repo(Products),{
    rowButtons: [{
      name: 'Show product name',
      icon: 'help',
      click: p => alert(p.name.value)
    },{
      name:'Show product price',
      icon: 'help',
      click: p => alert(p.price.value)
    }
  ]
  });
```
* Note that the `click` event receives as a parameter the row that was clicked

Explore the [RowButton](https://remult-ts.github.io/guide/ref_rowbutton) object for more options

## Grid Buttons
These buttons appear at the grid title, and are intended for actions that are relevant for all the displayed rows.
```ts{2-6}
  products = new GridSettings(this.remult.repo(Products),{
    gridButtons: [{
      name: 'Show product count',
      icon: 'help',
      click: async () => alert(await this.remult.repo(Products).count())
    }]
  });
```
Explore the [GridButton](https://remult-ts.github.io/guide/ref_gridbutton) object for more options

## Other Grid Options
Explore the [IDataSettings](https://remult-ts.github.io/guide/ref_idatasettings) object for more options
