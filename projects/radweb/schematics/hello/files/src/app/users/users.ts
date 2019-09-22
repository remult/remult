import * as radweb from 'radweb';
import { ColumnSetting, Entity, IdEntity, IdColumn, checkForDuplicateValue, StringColumn, BoolColumn, ColumnOptions } from "radweb";
import { changeDate } from '../shared/types';
import { DataColumnSettings } from 'radweb';
import { Context, EntityClass } from 'radweb';
import { Roles } from './roles';





@EntityClass
export class Users extends IdEntity<UserId>  {

    constructor(private context: Context) {

        super(new UserId(context), {
            name: "Users",
            allowApiRead: true,
            allowApiDelete: context.isSignedIn(),
            allowApiUpdate: context.isSignedIn(),
            allowApiInsert: true,
            onSavingRow: async () => {
                if (context.onServer) {
                    if (this.password.value && this.password.value != this.password.originalValue && this.password.value != Users.emptyPassword) {
                        this.realStoredPassword.value = Users.passwordHelper.generateHash(this.password.value);
                    }
                    if ((await context.for(Users).count()) == 0)
                        this.admin.value = true;

                    await checkForDuplicateValue(this, this.name);
                    if (this.isNew())
                        this.createDate.value = new Date();
                }
            },
            apiDataFilter: () => {
                if (!context.isSignedIn())
                    return this.id.isEqualTo("No User");
                else if (!(context.isAllowed(Roles.admin)))
                    return this.id.isEqualTo(this.context.user.id);
            }
        });
    }
    public static emptyPassword = 'password';
    name = new radweb.StringColumn({
        caption: "name",
        onValidate: () => {

            if (!this.name.value || this.name.value.length < 2)
                this.name.error = 'Name is too short';
        }
    });

    realStoredPassword = new StringColumn({
        dbName: 'password',
        includeInApi: false
    });
    password = new radweb.StringColumn({ caption: 'password', inputType: 'password', virtualData: () => this.realStoredPassword.value ? Users.emptyPassword : '' });

    createDate = new changeDate('Create Date');



    admin = new BoolColumn();
    static passwordHelper: PasswordHelper = {
        generateHash: x => { throw ""; },
        verify: (x, y) => { throw ""; }
    };

}
export interface PasswordHelper {
    generateHash(password: string): string;
    verify(password: string, realPasswordHash: string): boolean;
}


export class UserId extends IdColumn {

    constructor(private context: Context, settingsOrCaption?: ColumnOptions<string>) {
        super(settingsOrCaption);
    }
    getColumn(): ColumnSetting<Entity<any>> {
        return {
            column: this,
            getValue: f => (f ? ((f).__getColumn(this)) : this).displayValue,
            hideDataOnInput: true,
            readonly: this.context.isAllowed(this.allowApiUpdate),
            width: '200'

        }
    }
    get displayValue() {
        return this.context.for(Users).lookup(this).name.value;
    }



}

