import { DataApiServer, UserInfo } from '@remult/core';

import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
export class JWTCookieAuthorizationHelper {

    constructor(server: DataApiServer, private tokenSignKey: string, private authCookieName?: string) {
        if (!authCookieName) {
            this.authCookieName = 'authorization';

        }

        server.addRequestProcessor(async req => {
            let token = req.getHeader(this.authCookieName);
            if (token && token.startsWith('Bearer '))
                token = token.substring(7);
            if (token) {
                req.user = await <UserInfo><any>this.validateToken(token);
                
            } else {
                var h = req.getHeader('cookie');
                req.user = await this.authenticateCookie(h);
            }
            return !!req.user;
        })
    }

    private async authenticateCookie(cookieHeader: string) {
        if (cookieHeader) {
            for (const iterator of cookieHeader.split(';')) {
                let itemInfo = iterator.split('=');
                if (itemInfo && itemInfo[0].trim() == this.authCookieName) {
                    if (this.validateToken)
                        return await <UserInfo><any>this.validateToken(itemInfo[1]);
                }
            }
            return undefined;
        }
    }

    createSecuredTokenBasedOn(what: any, options?: {
        expiresIn: number
    }) {
        return jwt.sign(what, this.tokenSignKey, options);
    }



    validateToken: (token: string) => Promise<UserInfo> = async (x) => {
        let result: UserInfo;
        try {
            result = <UserInfo><any>jwt.verify(x, this.tokenSignKey);
        } catch (err) { }

        return result;
    };

}
