import { Entity } from "./entity";
import { DropDownItem, EntityProvider, EntityOrderBy, EntityWhere } from "./dataInterfaces1";
import { Column } from "./column";

export class DropDownSource<rowType extends Entity<any>>{
    async provideItems(): Promise<DropDownItem[]> {
  
      return (await this.provider.find({
        where: this.args.where,
        orderBy: this.args.orderBy
      })).map(x => {
        return {
          id: this.args.idColumn(x).value,
          caption: this.args.captionColumn(x).value
        }
      });
    }
    constructor(private provider: EntityProvider<rowType>, private args?: DropDownSourceArgs<rowType>) {
      if (!args) {
        this.args = args = {};
      }
      if (!args.idColumn) {
        args.idColumn = x => x.__idColumn;
      }
      if (!args.captionColumn) {
        let item = provider.create();
        let idCol = args.idColumn(item);
        for (const keyInItem of item.__iterateColumns()) {
          if (keyInItem != idCol) {
            args.captionColumn = x => x.__getColumn(keyInItem);
            break;
          }
        }
      }
    }
  }
  export interface DropDownSourceArgs<rowType extends Entity<any>> {
    idColumn?: (e: rowType) => Column<any>,
    captionColumn?: (e: rowType) => Column<any>,
    orderBy?: EntityOrderBy<rowType>,
    where?: EntityWhere<rowType>
  }