import { Roles } from './roles';
import { JWTCookieAuthorizationHelper } from '@remult/server';
import { ServerFunction } from '@remult/core';
import { UserInfo, Context } from '@remult/core';
import { Users } from './users';
export class ServerSignIn {
    static helper: JWTCookieAuthorizationHelper;
    @ServerFunction({ allowed: () => true })
    static async signIn(user: string, password: string, context?: Context) {
        let result: UserInfo;
        await context.for(Users).foreach(h => h.name.isEqualTo(user), async (h) => {
            if (!h.realStoredPassword.value || Users.passwordHelper.verify(password, h.realStoredPassword.value)) {
                result = {
                    id: h.id.value,
                    roles: [],
                    name: h.name.value
                };
                if (h.admin.value) {
                    result.roles.push(Roles.admin);
                }
            }
        });
        if (result) {
            return ServerSignIn.helper.createSecuredTokenBasedOn(<any>result);
        }
        return undefined;
    }
}
