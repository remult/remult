import { AuthenticatedInGuard } from '@remult/angular';
import { Injectable } from '@angular/core';



export const Roles = { 
    admin: 'admin'
}


@Injectable()
export class AdminGuard extends AuthenticatedInGuard {

    isAllowed() {
        return Roles.admin;
    }
}