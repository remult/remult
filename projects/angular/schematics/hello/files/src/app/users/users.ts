
import { IdEntity, FieldOptions, BackendMethod, Filter, Entity, Field, Validators, isBackend } from "remult";
import { Remult, } from 'remult';
import { Roles } from './roles';
import { InputField } from "@remult/angular";
import { InputTypes } from "remult/inputTypes";

@Entity<Users>("Users", {
    allowApiRead: remult => remult.authenticated(),
    allowApiDelete: Roles.admin,
    allowApiUpdate: remult => remult.authenticated(),
    allowApiInsert: Roles.admin
},
    (options, remult) => {
        options.apiPrefilter = (user) => {
            if (!(remult.isAllowed(Roles.admin)))
                return user.id.isEqualTo(remult.user.id);
            return new Filter(() => { });
        };
        options.saving = async (user) => {
            if (isBackend()) {
                if (user._.isNew()) {
                    user.createDate = new Date();
                    if ((await remult.repo(Users).count()) == 0)
                        user.admin = true;// If it's the first user, make it an admin
                }
            }
        }
    }
)
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
    constructor(private remult: Remult) {
        super();
    }
    async hashAndSetPassword(password: string) {
        this.password = (await import('password-hash')).generate(password);
    }
    async passwordMatches(password: string) {
        return !this.password || (await import('password-hash')).verify(password, this.password);
    }
    @BackendMethod({ allowed: true })
    async create(password: string) {
        if (!this._.isNew())
            throw "Invalid Operation";
        await this.hashAndSetPassword(password);
        await this._.save();
    }
    @BackendMethod({ allowed: remult => remult.authenticated() })
    async updatePassword(password: string) {
        if (this._.isNew() || this.id != this.remult.user.id)
            throw "Invalid Operation";
        await this.hashAndSetPassword(password);
        await this._.save();
    }
}
export class PasswordControl extends InputField<string>
{
    constructor(caption = 'password') {
        super({ caption, inputType: InputTypes.password, defaultValue: () => '' });
    }
}