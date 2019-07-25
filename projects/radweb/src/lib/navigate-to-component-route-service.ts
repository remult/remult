import { Router, Route, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable, Injector } from '@angular/core';
import { Context } from 'radweb';
@Injectable()
export class RouteHelperService {
    constructor(private router: Router,private injector:Injector) {

    }
  
    navigateToComponent(toComponent: { new(...args: any[]): any }) {
        let done = false;
        this.router.config.forEach(path => {
            if (done)
                return;
            if (path.component == toComponent) {
                done = true;
                this.router.navigate(['/' + path.path]);
            }
        });
        if (!done)
            console.warn("couldn't find path for ", toComponent, this.router.config);
    }
    canNavigateToRoute(route: Route) {
        if (!route.canActivate)
            return true;
        for (let guard of route.canActivate) {
            let g = this.injector.get(guard) as CanActivate;
            if (g && g.canActivate) {
                var r = new dummyRoute();
                r.routeConfig = route;
                let canActivate = g.canActivate(r, undefined);
                if (!canActivate)
                    return false;
            }
        }
        return true;
    }
}

@Injectable()
export class AuthorizedGuard implements CanActivate {
    constructor(private context: Context, private router: Router) {
    }
    canActivate(route: ActivatedRouteSnapshot) {
        let allowedRoles: string[];

        let data = route.routeConfig.data as AuthorizedGuardRouteData;
        if (data && data.allowedRoles)
            allowedRoles = data.allowedRoles;

        if (this.context.hasRole(...allowedRoles)) {
            return true;
        }
        if (!(route instanceof dummyRoute))
            this.router.navigate(['/']);
        return false;
    }
}
@Injectable()
export class NotLoggedInGuard implements CanActivate {
    constructor(private context: Context, private router: Router) {
    }
    canActivate(route: ActivatedRouteSnapshot) {
        let allowedRoles: string[];
        if (this.context.user)
            return false;
        return true;

    }
}
export interface AuthorizedGuardRouteData {
    allowedRoles?: string[];
    name?: string;

}
class dummyRoute extends ActivatedRouteSnapshot {
    constructor() {
        super();

    }
    routeConfig: any;
}
export interface AuthorizedGuardRoute extends Route {
    data?: {
        allowedRoles?: string[];
        name?: string;
    };
}
