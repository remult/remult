import { Context, UserInfo } from "@remult/core";


const authToken = 'authorization';
export class JwtSessionService {
    getToken() {
        return this.currentToken;
    }
    constructor(
        private context: Context
    ) {
      
    }
    private path: string;
    private tokenName: string;
    loadUserInfo(path?: string) {
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
                c = c.substring(0, i );
            }
            this._setToken(c); 
            localStorage.setItem(this.tokenName, c);
            
        }
    }

    async setToken(jwtToken: string, rememberOnDevice = false) {


        if (jwtToken) {
            this._setToken(jwtToken);
            let c = authToken + "=" + jwtToken;


            if (this.path) {
                c += '; path=/' + this.path;

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
    static createTokenOnServer: (user: UserInfo) => string;

    private currentToken: string;
    private _setToken(token: string) {
        this.currentToken = token;
        let user: UserInfo = undefined;
        if (this.currentToken) {
            {
                try { user = decodeToken(token); }
                catch (err) { console.log(err); }
            }
        }
        this.context.setUser(user);
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


function urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
      case 0: {
        break;
      }
      case 2: {
        output += "==";
        break;
      }
      case 3: {
        output += "=";
        break;
      }
      default: {
        throw new Error("Illegal base64url string!");
      }
    }
    return b64DecodeUnicode(output);
  }

  // credits for decoder goes to https://github.com/atk
  function b64decode(str: string): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let output = "";

    str = String(str).replace(/=+$/, "");

    if (str.length % 4 === 1) {
      throw new Error(
        "'atob' failed: The string to be decoded is not correctly encoded."
      );
    }

    for (
      // initialize result and counters
      let bc = 0, bs: any, buffer: any, idx = 0;
      // get next character
      (buffer = str.charAt(idx++));
      // character found in table? initialize bit storage and add its ascii value;
      ~buffer &&
      ((bs = bc % 4 ? bs * 64 + buffer : buffer),
      // and if not first of each 4 characters,
      // convert the first 8 bits to one ascii character
      bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      // try to find character in table (0-63, not found => -1)
      buffer = chars.indexOf(buffer);
    }
    return output;
  }

  function  b64DecodeUnicode(str: any) {
    return decodeURIComponent(
      Array.prototype.map
        .call(b64decode(str), (c: any) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  }

  function decodeToken(token: string ): UserInfo {
    if (!token || token === "") {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      throw new Error(
        "invalid token"
      );
    }

    const decoded = urlBase64Decode(parts[1]);
    if (!decoded) {
      throw new Error("Cannot decode the token.");
    }

    return JSON.parse(decoded);
  }
  import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';


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