import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Router, CanActivate, ActivatedRouteSnapshot, Route } from "@angular/router";


import { JwtSessionService } from '@remult/core';
import { Observable } from 'rxjs';



const authToken = 'authorization';

@Injectable()
export class AuthorizationInterceptor implements HttpInterceptor {
    constructor(private sessionManager: JwtSessionService) {


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