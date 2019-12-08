import { Injectable } from "@angular/core";
import { Router, CanActivate, ActivatedRouteSnapshot, Route } from "@angular/router";
import { JwtHelperService } from '@auth0/angular-jwt';


import { Context, UserInfo } from './context/Context';



const authToken = 'authorization';
@Injectable()
export class JwtSessionManager {



    constructor(
        private context: Context
    ) {



    }
    loadSessionFromCookie() {
        let c = document.cookie;
        let i = c.indexOf(authToken + '=');
        if (i >= 0) {
            c = c.substring(i + authToken.length + 2).trim();
            i = c.indexOf(';');
            if (i >= 0) {
                c = c.substring(0, i - 1);
            }
            this._setToken(c);

        }
    }

    async setToken(jwtToken: string, rememberOnDevice = false, pathForCookie?: string) {


        if (jwtToken) {
            this._setToken(jwtToken);
            let c = authToken + "=" + jwtToken;

            if (rememberOnDevice)
                c += '; expires = Thu, 01 Jan 2076 00:00:00 GMT';
            if (pathForCookie)
                c += '; path=' + pathForCookie;
            else
                c += ';path=/'
            document.cookie = c;
            return true;
        }
        else this.signout();
        return false;
    }

    private currentToken: string;
    private _setToken(token: string) {
        this.currentToken = token;
        let user: UserInfo = undefined;
        if (this.currentToken) {
            {
                try { user = new JwtHelperService().decodeToken(token); }
                catch (err) { console.log(err); }
            }
        }
        this.context._setUser(user);
        if (this.tokenInfoChanged)
            this.tokenInfoChanged();
    }
    tokenInfoChanged: () => void;

    signout(): any {
        this._setToken('');
        document.cookie = authToken + '=; expires = Thu, 01 Jan 1970 00:00:00 GMT';
    }
}



