
import { IdEntity, FieldSettings, ServerMethod, Filter, InputTypes, Entity, Field, Validators } from "@remult/core";
import { Context, } from '@remult/core';
import { Roles } from './roles';
import { InputField } from "@remult/angular";

@Entity<Users>({
    key: "Users",
    allowApiRead: context => context.isSignedIn(),
    allowApiDelete: Roles.admin,
    allowApiUpdate: context => context.isSignedIn(),
    allowApiInsert: Roles.admin,
    apiDataFilter: (user, context) => {
        if (!(context.isAllowed(Roles.admin)))
            return user.id.isEqualTo(context.user.id);
        return new Filter(() => { });
    },
    saving: async (user) => {
        
        if (user.context.onServer) {
            if (user._.isNew()) {
                user.createDate = new Date();
                if ((await user.context.for(Users).count()) == 0)
                    user.admin = true;// If it's the first user, make it an admin
            }
       }
    }
})
export class Users extends IdEntity {
    @Field({
        validate: [Validators.required, Validators.unique]
    })
    name: string = '';
    @Field({ includeInApi: false })
    password: string = '';
    @Field({
        allowApiUpdate: false
    })
    createDate: Date = new Date();

    @Field({
        allowApiUpdate: Roles.admin
    })
    admin: Boolean = false;
    constructor(private context: Context) {

        super();
    }
    async hashAndSetPassword(password: string) {
        this.password = (await import('password-hash')).generate(password);
    }
    async passwordMatches(password: string) {
        return !this.password || (await import('password-hash')).verify(password, this.password);
    }
    @ServerMethod({ allowed: true })
    async create(password: string) {
        if (!this._.isNew())
            throw "Invalid Operation";
        await this.hashAndSetPassword(password);
        await this._.save();
    }
    @ServerMethod({ allowed: context => context.isSignedIn() })
    async updatePassword(password: string) {
        if (this._.isNew() || this.id != this.context.user.id)
            throw "Invalid Operation";
        await this.hashAndSetPassword(password);
        await this._.save();
    }
}
export class PasswordControl extends InputField<string>
{
    constructor(settings?: FieldSettings) {
        super({ ...settings, caption: 'password', inputType: InputTypes.password, defaultValue: () => '' });
    }
}