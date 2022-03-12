import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { from, Observable } from 'rxjs';
import { ChromeSettingsModel } from '../services/chrome/chrome-settings.model';
import { getSyncStorage } from '../services/chrome/chrome-settings.service';

@Injectable({ providedIn: 'root' })
export class ChromeSettingsResolver implements Resolve<ChromeSettingsModel> {
    constructor() {}

    resolve(_route: ActivatedRouteSnapshot): Observable<ChromeSettingsModel> | Promise<ChromeSettingsModel> | ChromeSettingsModel {
        return from(getSyncStorage());
    }
}
