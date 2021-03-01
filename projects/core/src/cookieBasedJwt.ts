
import * as jwt from 'jsonwebtoken';
import { Context, UserInfo } from './context';
import { DataApiServer } from './data-api';

export class CookieBasedJwt {
    constructor(private context: Context, private pathForCookie?: string) {
        if (typeof document !== "undefined"){
            let c = document.cookie;
            let i = c.indexOf(this.authCookieName + '=');
            if (i >= 0) {
                c = c.substring(i + this.authCookieName.length + 1).trim();
                i = c.indexOf(';');
                if (i >= 0) {
                    c = c.substring(0, i - 1);
                }
                this._setToken(c);

            }
        }
        
    }
    private authCookieName = 'authorization';
    private tokenSignKey: string;
    createToken(userInfo: UserInfo, options?: { expiresIn: number }) {
        return jwt.sign(userInfo, this.tokenSignKey, options);
    }
    init(b: DataApiServer, tokenSignKey: string) {
        this.tokenSignKey = tokenSignKey;
        b.addRequestProcessor(async req => {
            const h = req.getHeader('cookie');
            req.user = await this.authenticateCookie(h);
            return !!req.user;
        });
    }

    tokenInfoChanged: () => void;
    afterSignIn(jwtToken: string, rememberOnDevice = false) {
        if (jwtToken) {
            this._setToken(jwtToken);
            let c = this.authCookieName + "=" + jwtToken;

            if (rememberOnDevice)
                c += '; expires = Thu, 01 Jan 2076 00:00:00 GMT';
            if (this.pathForCookie)
                c += '; path=' + this.pathForCookie;
            else
                c += ';path=/'
            document.cookie = c;
            return true;
        }
        else this.signOut();
        return false;
    }
    signOut() {
        this._setToken('');
        let c = this.authCookieName + '=; expires = Thu, 01 Jan 1970 00:00:00 GMT';
        if (this.pathForCookie)
            c += '; path=' + this.pathForCookie;
        else
            c += ';path=/'
        document.cookie = c;
    }
    private _setToken(token: string) {

        let user: UserInfo = undefined;
        if (token) {
            {
                try { user = jwt.decode(token) as UserInfo; }
                catch (err) { console.log(err); }
            }
        }
        this.context._setUser(user);
        if (this.tokenInfoChanged)
            this.tokenInfoChanged();
    }






    private async authenticateCookie(cookieHeader: string) {
        if (cookieHeader) {
            for (const iterator of cookieHeader.split(';')) {
                const itemInfo = iterator.split('=');
                if (itemInfo && itemInfo[0].trim() == this.authCookieName) {
                    if (this.validateToken)
                        return await this.validateToken(itemInfo[1]) as UserInfo;
                }
            }
            return undefined;
        }
    }



    private validateToken: (token: string) => Promise<UserInfo> = async (x) => {
        let result: UserInfo;
        try {
            result = jwt.verify(x, this.tokenSignKey) as UserInfo;
        } catch (err) {
            console.error(err);
        }

        return result;
    };
}
