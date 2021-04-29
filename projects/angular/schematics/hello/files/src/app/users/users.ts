
import { IdEntity, checkForDuplicateValue, StringColumn, BoolColumn, ColumnSettings, ServerMethod, LookupColumn, Filter } from "@remult/core";
import { changeDate } from '../shared/types';
import { Context, EntityClass } from '@remult/core';
import { Roles } from './roles';
import { extend } from "@remult/angular";

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
    createDate = new changeDate({ caption: 'Create Date' });

    admin = new BoolColumn({ allowApiUpdate: Roles.admin });
    constructor(private context: Context) {

        super({
            name: "Users",
            allowApiRead: context.isSignedIn(),
            allowApiDelete: Roles.admin,
            allowApiUpdate: context.isSignedIn(),
            allowApiInsert: Roles.admin,
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
                return new Filter(() => { });
            }
        });
    }
    @ServerMethod({ allowed: true })
    async create(password: string) {
        if (!this.isNew())
            throw "Invalid Operation";
        await this.password.hashAndSet(password);
        await this.save();
    }
    @ServerMethod({ allowed: context => context.isSignedIn() })
    async updatePassword(password: string) {
        if (this.isNew() || this.id.value != this.context.user.id)
            throw "Invalid Operation";
        await this.password.hashAndSet(password);
        await this.save();
    }
}



export class UserId extends LookupColumn<Users> {

    constructor(context: Context, settings?: ColumnSettings<string>) {
        super(context.for(Users), {
            displayValue: () => this.item.name.value
            , ...settings
        });
        extend(this).dataControl(settings => {
            settings.getValue = () => this.displayValue;
            settings.hideDataOnInput = true;
            settings.width = '200';
        });
    }

}
export class PasswordColumn extends StringColumn {

    constructor(settings?: ColumnSettings<string>) {
        super({
            ...{ caption: 'Password', inputType: 'password' },
            ...settings
        })
    }
    async hashAndSet(password: string) {
        this.value = (await import('password-hash')).generate(password);
    }
    async matches(password: string) {
        return !this.value || (await import('password-hash')).verify(password, this.value);
    }
}

