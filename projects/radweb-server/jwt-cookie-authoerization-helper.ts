import { DataApiServer} from 'radweb';

import * as jwt from 'jsonwebtoken';
import { Request } from 'express';
export class JWTCookieAuthorizationHelper<T>
{

    constructor(server: DataApiServer<T>, private tokenSignKey: string, private authCookieName?: string) {
        if (!authCookieName) {
            this.authCookieName = 'authorization';
        }

        server.addRequestProcessor(async req => {
            var h = req.getHeader('cookie');
            req.authInfo = await this.authenticateCookie(h);
            return !!req.authInfo;
        })
    }
    async authenticateRequest(req: Request) {
        return await this.authenticateCookie(<string>req.headers['cookie']);
    }
    private async authenticateCookie(cookieHeader: string) {
        if (cookieHeader) {
            for (const iterator of cookieHeader.split(';')) {
                let itemInfo = iterator.split('=');
                if (itemInfo && itemInfo[0].trim() == this.authCookieName) {
                    if (this.validateToken)
                        return await <T><any>this.validateToken(itemInfo[1]);
                }
            }
            return undefined;
        }
    }

    createSecuredTokenBasedOn(what: any) {
        return jwt.sign(what, this.tokenSignKey);
    }



    validateToken: (token: string) => Promise<T> = async (x) => {
        let result: T;
        try {
            result = <T><any>jwt.verify(x, this.tokenSignKey);
        } catch (err) { }

        return result;
    };

}
