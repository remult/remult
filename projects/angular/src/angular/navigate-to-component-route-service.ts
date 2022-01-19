import { Router, Route, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable, Injector } from '@angular/core';
import { Remult, Allowed } from 'remult';
@Injectable()
export class RouteHelperService {
    constructor(private router: Router, private injector: Injector) {

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
export declare type AngularComponent = { new(...args: any[]): any };
// @dynamic
@Injectable()
export class AuthenticatedGuard implements CanActivate {
    constructor(protected remult: Remult, private router: Router, private helper: RouteHelperService) {

    }
    isAllowed(): Allowed {
        return true;
    }
    static componentToNavigateIfNotAllowed:AngularComponent;
    
    canActivate(route: ActivatedRouteSnapshot) {
        if (this.remult.authenticated()&&this.remult.isAllowed(this.isAllowed())) {
            return true;
        }
        
        if (!(route instanceof dummyRoute)) {
            let x = AuthenticatedGuard.componentToNavigateIfNotAllowed;
            if (x != undefined) {
                this.helper.navigateToComponent(x);
            } else
                this.router.navigate(['/']);
        }
        return false;
    }
}


@Injectable()
export class NotAuthenticatedGuard implements CanActivate {
    constructor(private remult: Remult, private router: Router) {
    }
    canActivate(route: ActivatedRouteSnapshot) {

        if (this.remult.authenticated())
            return false;
        return true;

    }
}

class dummyRoute extends ActivatedRouteSnapshot {
    constructor() {
        super();

    }
    routeConfig: any;
}
