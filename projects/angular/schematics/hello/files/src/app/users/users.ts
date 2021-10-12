
import { IdEntity, FieldOptions, BackendMethod, Filter, Entity, Field, Validators, isBackend, Allow } from "remult";
import { Remult, } from 'remult';
import { Roles } from './roles';
import { InputField } from "@remult/angular";
import { InputTypes } from "remult/inputTypes";
import { terms } from "../terms";

@Entity<Users>("Users", {
    allowApiRead: Allow.authenticated,
    allowApiUpdate: Allow.authenticated,
    allowApiDelete: Roles.admin,
    allowApiInsert: Roles.admin
},
    (options, remult) => {
        options.apiPrefilter = (user) => {
            if (!(remult.isAllowed(Roles.admin)))
                return user.id.isEqualTo(remult.user.id);
            return undefined!;
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
        validate: [Validators.required, Validators.unique],
        caption: terms.username
    })
    name: string = '';
    @Field({ includeInApi: false })
    password: string = '';
    @Field({
        allowApiUpdate: false
    })
    createDate: Date = new Date();

    @Field({
        allowApiUpdate: Roles.admin,
        caption:terms.admin
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
            throw new Error(terms.invalidOperation);
        await this.hashAndSetPassword(password);
        await this._.save();
    }
    @BackendMethod({ allowed: Allow.authenticated })
    async updatePassword(password: string) {
        if (this._.isNew() || this.id != this.remult.user.id)
            throw new Error(terms.invalidOperation);
        await this.hashAndSetPassword(password);
        await this._.save();
    }
}
export class PasswordControl extends InputField<string>
{
    constructor(caption = terms.password) {
        super({ caption, inputType: InputTypes.password, defaultValue: () => '' });
    }
}