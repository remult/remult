
import { IdEntity, IdColumn, checkForDuplicateValue, StringColumn, BoolColumn, ColumnOptions, UserInfo, ColumnSettings, ServerFunction, ServerMethod } from "@remult/core";
import { changeDate } from '../shared/types';
import { Context, EntityClass } from '@remult/core';
import { Roles } from './roles';
import { userInfo } from "os";

@EntityClass
export class Users extends IdEntity {
    name = new StringColumn({
        caption: "name",
        validate: () => {

            if (!this.name.value || this.name.value.length < 2)
                this.name.validationError = 'Name is too short';
        }
    });
    password = new PasswordColumn({
        includeInApi: false
    });
    createDate = new changeDate('Create Date');

    admin = new BoolColumn();
    constructor(private context: Context) {

        super({
            name: "Users",
            allowApiRead: context.isSignedIn(),
            allowApiDelete: Roles.admin,
            allowApiUpdate: context.isSignedIn(),
            allowApiInsert: false,
            saving: async () => {
                if (context.onServer) {

                    if (this.isNew()) {
                        this.createDate.value = new Date();
                        if ((await context.for(Users).count()) == 0)
                            this.admin.value = true;// If it's the first user, make it an admin
                    }
                    await checkForDuplicateValue(this, this.name, this.context.for(Users));

                }
            },
            apiDataFilter: () => {
                if (!(context.isAllowed(Roles.admin)))
                    return this.id.isEqualTo(this.context.user.id);
            }
        });
    }
    @ServerMethod({ allowed: true })
    async create(password: string) {
        if (!this.isNew())
            throw "Invalid Operation";
        this.password.value = PasswordColumn.passwordHelper.generateHash(password);
        await this.save();
    }
    @ServerMethod({ allowed: context => context.isSignedIn() })
    async updatePassword(password: string) {
        if (this.isNew() || this.id.value != this.context.user.id)
            throw "Invalid Operation";
        this.password.value = PasswordColumn.passwordHelper.generateHash(password);
        await this.save();
    }
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
export class PasswordColumn extends StringColumn {

    constructor(settings?: ColumnSettings<string>) {
        super({
            ...{ caption: 'Password' },
            ...settings,
            dataControlSettings: () => ({
                inputType: 'password'
            })
        })
    }
    static passwordHelper: {
        generateHash(password: string): string;
        verify(password: string, realPasswordHash: string): boolean;
    };
}

