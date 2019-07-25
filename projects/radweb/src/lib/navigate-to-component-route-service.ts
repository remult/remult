import { Router, Route } from '@angular/router';
import { Injectable } from '@angular/core';
@Injectable()
export class NavigateToComponentRouteService {
    constructor(private router: Router) {

    }
  
    navigate(toComponent: { new(...args: any[]): any }) {
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
}