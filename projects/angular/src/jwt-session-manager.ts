import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router, CanActivate, ActivatedRouteSnapshot, Route } from "@angular/router";
import { JwtHelperService } from '@auth0/angular-jwt';


import { Context, UserInfo } from '@remult/core';
import { Observable } from 'rxjs';



const authToken = 'authorization';
@Injectable()
export class JwtSessionManager {
    getToken() {
        return this.currentToken;
    }
    constructor(
        private context: Context
    ) {
    }
    private path: string;
    private tokenName: string;
    loadSessionFromCookie(path?: string) {
        this.path = path;
        this.tokenName = authToken;
        if (this.path)
            this.tokenName += '/' + path;
        let token = sessionStorage.getItem(this.tokenName);
        if (token) {
            this.setToken(token);
            return;
        }
         token = localStorage.getItem(this.tokenName);
        if (token) {
            this.setToken(token);
            return;
        }

        let c = document.cookie;
        let i = c.indexOf(authToken + '=');
        if (i >= 0) {
            c = c.substring(i + authToken.length + 1).trim();
            i = c.indexOf(';');
            if (i >= 0) {
                c = c.substring(0, i - 1);
            }
            this.setToken(c); 
            
        }
    }

    async setToken(jwtToken: string, rememberOnDevice = false) {


        if (jwtToken) {
            this._setToken(jwtToken);
            let c = authToken + "=" + jwtToken;


            if (this.path) {
                c += '; path=' + this.path;

            }
            else
                c += ';path=/'

            if (rememberOnDevice) {
                c += '; expires = Thu, 01 Jan 2076 00:00:00 GMT';
                localStorage.setItem(this.tokenName, jwtToken);
            }
            sessionStorage.setItem(this.tokenName, jwtToken); 
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
        let c = authToken + '=; expires = Thu, 01 Jan 1970 00:00:00 GMT';
        if (this.path)
            c += '; path=' + this.path;
        else
            c += ';path=/'
        document.cookie = c;
        localStorage.removeItem(this.tokenName);
        sessionStorage.removeItem(this.tokenName);
    }
}



@Injectable()
export class AuthorizationInterceptor implements HttpInterceptor {
    constructor(private sessionManager: JwtSessionManager) {


    }
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let authReq = req;
        const token = this.sessionManager.getToken();
        if (token && token.length > 0) {
            authReq = req.clone({ headers: req.headers.set(authToken, 'Bearer ' + token) });
        }
        return next.handle(authReq);
    }
}