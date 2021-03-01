
import { Entity, IdEntity, IdColumn, checkForDuplicateValue, StringColumn, BoolColumn, ColumnOptions } from "@remult/core";
import { changeDate } from '../shared/types';
import { Context, EntityClass } from '@remult/core';
import { Roles } from './roles';





@EntityClass
export class Users extends IdEntity {

    constructor(private context: Context) {

        super({
            name: "Users",
            allowApiRead: true,
            allowApiDelete: context.isSignedIn(),
            allowApiUpdate: context.isSignedIn(),
            allowApiInsert: true,
            saving: async () => {
                if (context.onServer) {
                    if (this.password.value && this.password.value != this.password.originalValue && this.password.value != Users.emptyPassword) {
                        this.realStoredPassword.value = Users.passwordHelper.generateHash(this.password.value);
                    }
                    if ((await context.for(Users).count()) == 0)
                        this.admin.value = true;

                    await checkForDuplicateValue(this, this.name, this.context.for(Users));
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
    name = new StringColumn({
        caption: "name",
        validate: () => {

            if (!this.name.value || this.name.value.length < 2)
                this.name.validationError = 'Name is too short';
        }
    });

    realStoredPassword = new StringColumn({
        dbName: 'password',
        includeInApi: false
    });
    password = new StringColumn({ caption: 'password', dataControlSettings: () => ({ inputType: 'password' }), serverExpression: () => this.realStoredPassword.value ? Users.emptyPassword : '' });

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
        super({
            dataControlSettings: () => ({
                getValue: () => this.displayValue,
                hideDataOnInput: true,
                width: '200'
            })
        }, settingsOrCaption);
    }
    get displayValue() {
        return this.context.for(Users).lookup(this).name.value;
    }



}

